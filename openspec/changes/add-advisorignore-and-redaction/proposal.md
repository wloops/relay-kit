## Why

`advisor ask` 和 `advisor review` 会把 git 状态、diff、任务说明和可选命令日志沉淀到 handoff 文档中。当前已有少量硬编码排除规则，但缺少项目级 `.advisorignore`、统一脱敏和可配置日志截断，仍可能把密钥、环境变量、大文件或无关目录带入 `ASK_ADVISOR.md` / `REVIEW_REQUEST.md`。

本变更的目标是在不改变 advisor 主流程、不引入复杂安全扫描器的前提下，为上下文收集增加一层默认安全边界。

## What Changes

- 新增 `.advisorignore` 支持，用于定义 advisor 上下文收集应忽略的路径模式。
- 保留并扩展默认忽略规则：
  - `.env`
  - `.env.*`
  - `node_modules/`
  - `dist/`
  - `build/`
  - `coverage/`
  - `.git/`
  - `*.pem`
  - `*.key`
  - `*.crt`
  - `*.p12`
  - `*.log`
- `advisor init` 可生成默认 `.advisorignore`，并遵守“不覆盖已有用户文件，除非显式 `--force`”的既有写入策略。
- `advisor ask` / `advisor review` 收集 git status、diff、diff stat、任务上下文和命令日志时统一应用默认忽略规则与 `.advisorignore`。
- 对常见敏感信息做基础脱敏：
  - API key
  - token
  - secret
  - password
  - bearer token
  - private key block
- 在 `ASK_ADVISOR.md` / `REVIEW_REQUEST.md` 中标记安全处理状态：
  - 已应用忽略规则
  - 已应用脱敏规则
- 新增配置项 `maxLogLines`，并继续支持现有 `maxDiffLines`，分别限制命令日志和 diff 内容进入 handoff 的行数。
- 补充测试，覆盖 `.advisorignore` 解析、默认忽略、git 上下文过滤、日志截断、基础脱敏和模板标记。

不包含：

- 不做复杂安全扫描器。
- 不上传代码。
- 不自动调用模型 API。
- 不做 GUI。
- 不改变 advisor 的 `init → start → ask → resume → review → doctor` 主流程。

## Capabilities

### New Capabilities

- `advisor-context-safety`: 定义 advisor 在生成 ask/review handoff 时的忽略规则、基础脱敏、截断配置和安全标记要求。

### Modified Capabilities

- 无。本次不修改已发布的 `skills-sync` capability。

## Impact

- 影响 CLI 与配置：
  - `src/commands/init.ts`
  - `src/commands/ask.ts`
  - `src/commands/review.ts`
  - `.advisor-kit/config.json`
- 影响核心上下文收集与安全处理：
  - `src/core/config.ts`
  - `src/core/constants.ts`
  - `src/core/excludes.ts`
  - `src/core/git.ts`
  - `src/core/command-runner.ts`
  - 可能新增 `src/core/advisorignore.ts`、`src/core/redaction.ts` 或等价模块。
- 影响模板：
  - `templates/ASK_ADVISOR.template.md`
  - `templates/REVIEW_REQUEST.template.md`
  - 可能新增 `templates/ADVISORIGNORE.template`。
- 影响测试：
  - `tests/core.test.ts`
  - `tests/commands.test.ts`
  - 可能新增专门的 ignore/redaction 测试文件。
- 不新增运行时外部服务依赖，不改变模型调用边界，也不改变 handoff 文件的核心用途。
