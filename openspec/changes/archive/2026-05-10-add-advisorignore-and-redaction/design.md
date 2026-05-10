## Context

当前实现已经有一层基础安全处理：

- `src/core/constants.ts` 定义了 `.env`、`.env.*`、`node_modules`、`dist`、`build`、`coverage` 等默认排除项。
- `src/core/excludes.ts` 能过滤包含敏感路径的 git 输出行。
- `src/core/git.ts` 在 `git status`、`git diff --stat`、`git diff` 中使用固定 pathspec 排除部分路径，并用 `maxDiffLines` 截断 diff。
- `src/core/command-runner.ts` 对 build/test 输出使用固定 160 行截断。
- `advisor ask` 和 `advisor review` 分别在命令层拼装上下文，没有统一的“忽略 + 脱敏 + 截断 + 标记”处理结果。

这说明项目已有正确方向，但规则分散、不可配置，也没有 `.advisorignore` 和敏感文本脱敏。新能力应作为本地上下文安全增强，而不是安全审计系统。

## Goals / Non-Goals

**Goals:**

- 为 advisor 上下文收集提供统一安全入口，供 `ask` 和 `review` 复用。
- 支持项目根目录 `.advisorignore`，并与默认忽略规则、配置中的 `excludePatterns` 合并。
- `advisor init` 在项目中生成默认 `.advisorignore`，但不覆盖用户已有文件，除非显式 `--force`。
- 对进入 `ASK_ADVISOR.md` / `REVIEW_REQUEST.md` 的文本做基础脱敏。
- 让 `maxDiffLines` 和新增 `maxLogLines` 都来自配置，并兼容旧配置文件。
- 在 handoff 模板中明确标记已应用忽略规则和脱敏规则。
- 补测试，覆盖核心边界，而不是只测 happy path。

**Non-Goals:**

- 不实现复杂 secret scanner，不做熵检测、不做多语言 AST 分析。
- 不扫描整个工作区并生成安全报告。
- 不读取或上传被忽略文件内容。
- 不调用模型 API，不新增远程服务。
- 不改变 `advisor ask` / `advisor review` 的主流程和输出文件位置。
- 不把 `.advisorignore` 做成完整 `.gitignore` 兼容实现；只支持本项目上下文收集需要的稳定子集。

## Decisions

### 1. 引入统一 Context Safety 层

新增或重构为一个共享模块，例如：

```text
src/core/advisorignore.ts
src/core/redaction.ts
src/core/context-safety.ts
```

职责划分：

- `advisorignore.ts`：读取 `.advisorignore`，合并默认规则与配置规则，并判断路径是否应忽略。
- `redaction.ts`：对文本执行基础敏感信息脱敏。
- `context-safety.ts`：提供面向命令层的组合能力，例如 `createContextSafety(root, config)`，返回 matcher、redactor 和可写入模板的安全标记。

理由：

- `ask` 和 `review` 都需要同样的上下文安全语义，不能分别复制规则。
- 未来如果 `start`、`doctor` 或 `sync` 需要展示安全状态，也可以复用同一模块。
- 这比继续在 `git.ts`、`command-runner.ts`、命令文件里分散添加规则更容易测试。

替代方案：

- 只扩展 `excludes.ts`。这会让忽略、脱敏、模板标记混在一个模块里，后续难以维护。
- 引入完整 `.gitignore` 解析依赖。当前包依赖很少，需求也只要求基础能力，新增依赖不是必要条件。

### 2. `.advisorignore` 使用稳定子集语义

`.advisorignore` 位于项目根目录，格式采用 `.gitignore` 风格的稳定子集：

- 空行忽略。
- `#` 开头为注释。
- 以 `/` 结尾表示目录模式，例如 `logs/`。
- 包含 `*` 的模式按 glob 处理，例如 `*.pem`、`.env.*`。
- 不包含通配符的模式可匹配文件名或路径片段，例如 `.env`、`dist/`。
- Windows 路径在匹配前统一转成 `/`。

默认规则始终生效，`.advisorignore` 只能增加忽略范围，不能取消默认安全规则。暂不支持 `!` 反向取消规则，因为允许取消 `.env`、私钥等默认规则会削弱安全边界。

默认 `.advisorignore` 内容应包含：

```text
# advisor-kit context ignore rules
.env
.env.*
node_modules/
dist/
build/
coverage/
.git/
*.pem
*.key
*.crt
*.p12
*.log
```

### 3. Git 上下文先 pathspec 排除，再文本过滤和脱敏

`collectGitContext` 应从只接收 `maxDiffLines` 改为接收一个上下文安全对象或等价参数：

```ts
collectGitContext(root, {
  maxDiffLines,
  ignoreMatcher,
  redact,
})
```

处理顺序：

1. 用默认规则、配置规则和 `.advisorignore` 生成 git pathspec 排除项。
2. 执行 `git status --short`、`git diff --stat`、`git diff` 时传入可表达的 pathspec。
3. 对 git 输出再按路径行过滤，处理 pathspec 无法覆盖或 diff header 暴露路径的情况。
4. 对剩余文本执行脱敏。
5. 对 diff 按 `maxDiffLines` 截断。

理由：

- pathspec 能避免读取大部分被忽略文件的 diff 内容。
- 文本过滤是第二道防线，避免路径出现在 status/diff header 中。
- 脱敏必须作为进入模板前的最后一道处理，确保任务说明、OpenSpec 摘要或命令日志中偶然出现的 token 也会被替换。

### 4. 命令日志使用 `maxLogLines`

新增配置项：

```json
{
  "maxDiffLines": 500,
  "maxLogLines": 160
}
```

`createDefaultConfig` 默认写入 `maxLogLines: 160`。`loadConfig` 需要对旧配置做兼容补默认值，因为已有项目的 `.advisor-kit/config.json` 不会包含该字段。

`runShellCommand` 不再硬编码 160 行，而是接收 `maxLogLines`：

```ts
runShellCommand(root, command, { maxLogLines, redact })
```

命令输出处理顺序：

1. 拼接 stdout/stderr。
2. 执行脱敏。
3. 按 `maxLogLines` 截断。

日志不做路径忽略扫描，因为命令输出不是文件枚举结果；但脱敏必须覆盖日志中的 token、password、bearer token 和 private key block。

### 5. 基础脱敏规则保守覆盖常见形态

脱敏函数应只替换值，不删除整段上下文，便于 Advisor 理解错误位置。建议输出统一占位：

```text
[REDACTED]
[REDACTED_PRIVATE_KEY]
```

初始规则覆盖：

- `Authorization: Bearer <value>` / `Bearer <value>`
- `api_key=...`、`apiKey: ...`、`OPENAI_API_KEY=...` 等 key/value 形态
- `token=...`
- `secret=...`
- `password=...`
- PEM private key block：`-----BEGIN ... PRIVATE KEY-----` 到 `-----END ... PRIVATE KEY-----`

关键词匹配大小写不敏感。实现时应避免把普通短词误脱敏，值侧至少要求有非空 token，并尽量保留 key 名：

```text
OPENAI_API_KEY=[REDACTED]
Authorization: Bearer [REDACTED]
```

这不是安全扫描器，只是基础防漏层；文档和注释需要明确这一点。

### 6. 模板增加安全标记

`ASK_ADVISOR.template.md` 和 `REVIEW_REQUEST.template.md` 增加类似区块：

```md
## Context Safety
- Ignore Rules: applied (default + .advisorignore if present)
- Redaction Rules: applied
```

模板变量可使用：

```text
{{ignoreRulesStatus}}
{{redactionRulesStatus}}
```

建议状态包含是否发现 `.advisorignore`，例如：

- `applied: default rules only`
- `applied: default rules + .advisorignore`

不要在 handoff 中列出全部规则内容，避免输出过长；测试只需确认标记存在且值正确。

### 7. `advisor init` 生成默认 `.advisorignore`

`runInit` 在写入 config/state、创建 handoff 目录和注入 AGENTS 规则的同时，尝试创建 `.advisorignore`：

- 文件不存在：写入默认模板。
- 文件存在且未传 `--force`：保留用户文件。
- 文件存在且传 `--force`：是否覆盖需要和现有托管文件策略一致；如果担心覆盖用户 ignore 规则，优先选择“保留已有文件并在 summary 提示已存在”。实现前可在任务中明确。

考虑到 `.advisorignore` 是用户可编辑文件，而不是完全由 advisor-kit 管理的内部状态，推荐即使 `--force` 也不覆盖已有 `.advisorignore`，只在 summary 中提示。若后续需要重写，可新增专门选项。

### 8. 测试策略

测试应覆盖行为，不要求覆盖所有正则分支：

- `.advisorignore`：
  - 默认规则命中 `.env`、`.env.local`、`.git/config`、`*.pem`、`*.log`。
  - 用户规则命中自定义目录或文件。
  - `!` 反向规则不取消默认忽略。
- 脱敏：
  - key/value、bearer token、private key block 被替换。
  - 非敏感普通文本保持可读。
- `ask`：
  - `--run build` 的日志按 `maxLogLines` 截断并脱敏。
  - `ASK_ADVISOR.md` 包含安全标记。
  - 被忽略文件的 diff/status 不进入 handoff。
- `review`：
  - diff 内容按 `.advisorignore` 过滤并脱敏。
  - `REVIEW_REQUEST.md` 包含安全标记。
- 配置兼容：
  - 缺少 `maxLogLines` 的旧配置仍能运行，并使用默认 160。

## Risks / Trade-offs

- [Risk] 自实现 ignore 子集无法完全兼容 `.gitignore`。  
  Mitigation: 文档明确是 `.advisorignore` 的稳定子集；只承诺本工具需要的基础语义，避免复杂边界。
- [Risk] 正则脱敏可能误判或漏判。  
  Mitigation: 只做基础规则，保持占位可读；把目标限定为降低常见泄露风险，而不是安全合规扫描。
- [Risk] git pathspec 不能表达所有 `.advisorignore` 规则。  
  Mitigation: pathspec 作为第一层优化，后续文本过滤和脱敏作为第二层防线。
- [Risk] 旧配置缺少 `maxLogLines` 导致运行时报错。  
  Mitigation: `loadConfig` 归一化配置，为缺失字段补默认值。
- [Risk] `--force` 覆盖 `.advisorignore` 可能删除用户自定义规则。  
  Mitigation: 推荐默认不覆盖已有 `.advisorignore`，summary 说明已保留。

## Migration Plan

1. 新版本 `advisor init` 在新项目中生成 `.advisorignore`。
2. 已初始化项目运行任意命令时，`loadConfig` 为缺失的 `maxLogLines` 补默认值。
3. 已初始化项目如果没有 `.advisorignore`，`ask/review` 仍应用内置默认规则。
4. 用户可手动添加 `.advisorignore`，下一次 `ask/review` 自动生效。
5. 如发现误忽略，用户只能调整自定义规则；默认安全规则不可取消。

## Open Questions

- `advisor init --force` 是否应该覆盖已有 `.advisorignore`？设计建议不覆盖，并在 summary 提示保留。
- 是否需要在 `advisor doctor` 中提示 `.advisorignore` 缺失？本变更可以不做，避免扩大范围。
- 是否需要把脱敏命中数量写入 handoff？当前建议只标记规则已应用，不输出数量，避免给文档增加噪音。
