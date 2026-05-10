## Why

`ai-advisor-kit` 已经具备可运行的 MVP CLI、模板、Skills 和测试，但还没有被整理成一个可以让外部项目本地安装、试用并通过 npm 发布预检的 alpha 包。现在需要把发布前的包配置、README、示例流程和验证清单补齐，确保 v0.1 alpha 能作为真实项目中的保守工作流工具被试用。

这次变更解决的是“从仓库内可运行”到“可分发、可安装、可验证”的缺口，而不是扩展主流程能力。

## What Changes

- 检查并必要时调整 `package.json` 的发布字段：
  - `name`
  - `version`
  - `description`
  - `bin`
  - `files`
  - `scripts`
  - `license`
  - `repository` 可暂时留空或标记 TODO
- 补充 README 的面向用户使用说明：
  - 安装方式
  - `advisor init`
  - `advisor start`
  - `advisor ask`
  - `advisor resume`
  - `advisor review`
  - `advisor doctor`
  - `advisor sync --skills`
  - simple 模式示例
  - OpenSpec 模式示例
  - Skills 安装目录说明
  - 安全说明
- 增加 examples 或 smoke-test 文档，覆盖：
  - simple 项目流程
  - OpenSpec 项目流程
- 增加并执行发布前验证清单：
  - `pnpm build`
  - `pnpm test`
  - `npm pack`
  - `npm publish --dry-run`
- 验证本地安装与真实项目试用流程：
  - `npm link`
  - `advisor --help`
  - 在临时项目中运行 `init`、`start`、`ask`、`review`、`doctor`
- 检查 npm 发布包内容必须包含：
  - `dist`
  - `templates`
  - `skills`
  - `README.md`
- 检查 npm 发布包内容不得包含：
  - `node_modules`
  - 测试临时目录
  - `.env`
  - OpenSpec 开发中的临时内容

## Capabilities

### New Capabilities

- 无。本次是 v0.1 alpha 发布准备、文档和验证流程整理，不新增运行时 capability。

### Modified Capabilities

- 无。本次不改变既有 CLI、Skills 同步或 OpenSpec 集成的需求语义。

## Impact

- 主要影响发布元数据与面向用户文档：
  - `package.json`
  - `README.md`
  - 后续新增的 `examples/**` 或 `docs/**` smoke-test 文档
- 影响发布验证流程：
  - npm pack 内容检查
  - npm publish dry-run
  - npm link 本地安装验证
  - 临时项目中的 simple/OpenSpec smoke test
- 不新增依赖，不新增 GUI，不新增模型 API 调用，不新增 lane 并行能力，不改变 `advisor init/start/ask/resume/review/doctor/sync --skills` 的主流程设计。
