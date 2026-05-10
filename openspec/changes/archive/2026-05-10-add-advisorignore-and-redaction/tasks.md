## 1. 上下文安全基础模块

- [x] 1.1 梳理现有 `src/core/constants.ts`、`src/core/excludes.ts`、`src/core/git.ts`、`src/core/command-runner.ts` 的职责，确定保留、迁移和复用边界。
- [x] 1.2 新增或重构 `.advisorignore` 读取模块，支持空行、注释、目录模式、基础 glob、路径归一化和默认规则合并。
- [x] 1.3 扩展默认忽略规则，覆盖 `.env`、`.env.*`、`node_modules/`、`dist/`、`build/`、`coverage/`、`.git/`、`*.pem`、`*.key`、`*.crt`、`*.p12`、`*.log`。
- [x] 1.4 确保默认忽略规则不可被 `.advisorignore` 反向取消，并用注释说明这是安全边界而不是完整 `.gitignore` 兼容实现。
- [x] 1.5 新增基础脱敏模块，覆盖 API key、token、secret、password、bearer token 和 private key block。
- [x] 1.6 为上下文安全模块提供统一入口，返回路径忽略判断、文本脱敏函数和 handoff 安全状态描述。

## 2. 配置与初始化

- [x] 2.1 在 `AdvisorConfig` 中新增 `maxLogLines`，并保持 `maxDiffLines` 语义不变。
- [x] 2.2 更新 `createDefaultConfig`，默认写入 `maxDiffLines: 500` 和 `maxLogLines: 160`。
- [x] 2.3 更新 `loadConfig` 的兼容逻辑，为旧配置缺失的 `maxLogLines` 和未来缺失的安全相关字段补默认值。
- [x] 2.4 新增默认 `.advisorignore` 模板或常量，内容包含本变更定义的默认忽略规则。
- [x] 2.5 更新 `advisor init`，在项目根目录不存在 `.advisorignore` 时生成默认文件。
- [x] 2.6 确认 `advisor init` 不覆盖用户已有 `.advisorignore`；如传入 `--force`，也应保留或明确按设计决策处理，并在 summary 中说明。

## 3. ask / review 上下文收集

- [x] 3.1 更新 `collectGitContext`，接收上下文安全配置，并在 git pathspec、输出行过滤、脱敏和截断中统一应用。
- [x] 3.2 确保 `git status`、`git diff --stat`、`git diff` 都遵守默认忽略规则和 `.advisorignore`。
- [x] 3.3 更新 `runShellCommand`，移除硬编码 160 行，改用配置的 `maxLogLines`。
- [x] 3.4 确保 build/test 日志在写入 handoff 前先脱敏，再按 `maxLogLines` 截断。
- [x] 3.5 更新 `advisor ask`，构建上下文安全对象，并对当前任务、OpenSpec 上下文、错误日志、git status 和 diff summary 应用脱敏与安全标记。
- [x] 3.6 更新 `advisor review`，构建上下文安全对象，并对任务上下文、OpenSpec 上下文、diff summary 和 diff 内容应用脱敏与安全标记。
- [x] 3.7 确认本变更不改变 `advisor ask` / `advisor review` 的文件路径、主流程、模型调用边界或 git 自动化边界。

## 4. Handoff 模板

- [x] 4.1 更新 `templates/ASK_ADVISOR.template.md`，新增 `Context Safety` 区块，标记忽略规则已应用。
- [x] 4.2 更新 `templates/ASK_ADVISOR.template.md`，标记脱敏规则已应用。
- [x] 4.3 更新 `templates/REVIEW_REQUEST.template.md`，新增 `Context Safety` 区块，标记忽略规则已应用。
- [x] 4.4 更新 `templates/REVIEW_REQUEST.template.md`，标记脱敏规则已应用。
- [x] 4.5 确保模板变量缺失时不会把 `undefined` 写入 handoff，而是保持现有空字符串渲染行为或显式默认值。

## 5. 测试

- [x] 5.1 为 `.advisorignore` 解析和路径匹配补充单元测试，覆盖默认规则、自定义规则、Windows 路径归一化和反向规则不取消默认忽略。
- [x] 5.2 为脱敏规则补充单元测试，覆盖 key/value、bearer token、private key block 和普通文本不误删。
- [x] 5.3 为配置兼容补充测试，覆盖旧配置缺失 `maxLogLines` 时仍能运行。
- [x] 5.4 为 `advisor init` 补充测试，覆盖默认生成 `.advisorignore` 和已有 `.advisorignore` 不被覆盖。
- [x] 5.5 为 `advisor ask` 补充集成测试，覆盖被忽略 diff/status 不进入 `ASK_ADVISOR.md`、日志脱敏、`maxLogLines` 截断和安全标记。
- [x] 5.6 为 `advisor review` 补充集成测试，覆盖被忽略 diff 不进入 `REVIEW_REQUEST.md`、diff 脱敏、`maxDiffLines` 截断和安全标记。

## 6. 验证与文档一致性

- [x] 6.1 运行测试套件，确保现有 `init/start/ask/resume/review/doctor` 流程不回归。
- [x] 6.2 运行构建或类型检查，确认新增类型和配置兼容逻辑可打包。
- [x] 6.3 手动验证一个包含 `.env`、私钥片段、bearer token、`.log` 文件和自定义 `.advisorignore` 规则的示例项目。
- [x] 6.4 检查生成的 `ASK_ADVISOR.md` 和 `REVIEW_REQUEST.md`，确认包含安全标记且不包含明文敏感值。
- [x] 6.5 更新 README 或 CLI 文档中关于 `.advisorignore`、`maxDiffLines`、`maxLogLines` 和基础脱敏边界的说明。
