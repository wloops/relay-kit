# Changelog

## 0.2.0 (2026-05-10)

### BREAKING CHANGE

- 项目重命名：`ai-advisor-kit` → `relay-kit`，CLI 命令 `advisor` → `relay`
- 配置目录：`.advisor-kit/` → `.relay/`
- 忽略文件：`.advisorignore` → `.relayignore`
- AGENTS.md 注入标记：`<!-- advisor-kit:start -->` → `<!-- relay-kit:start -->`
- Skill 目录前缀：`advisor-*` → `relay-*`

### Added

- 显式角色命令体系：`/relay:plan`、`/relay:run`、`/relay:review`、`/relay:fix`
- DIRECT_FIX 模式：Advisor 满足 4 条件之一可直接修改代码
- `/relay:run` 自动检测 EXECUTOR_TASK.md 或 RESUME_PROMPT.md
- 新增 `relay-runner` 和 `relay-fixer` Skill
- state.json 扩展：advisorMode、executorFailures、directFixLog 字段

### Migration

1. 删除旧的 `.advisor-kit/` 目录
2. 删除 `.advisorignore`（如存在）
3. 删除 `.claude/skills/advisor-*`、`.agents/skills/advisor-*`
4. 移除 `AGENTS.md` 中 `<!-- advisor-kit:start -->` 到 `<!-- advisor-kit:end -->` 之间的内容
5. 运行 `relay init` 重新初始化

## v0.1.0 (2026-05-10)

### Added

- 初始 CLI 版本，基于 `commander` 实现
- 支持 skills install、skills list、skills update、advise、init 等核心命令
- OpenSpec 变更管理工作流集成
- 27 个单元测试覆盖核心功能
- TypeScript 严格模式（`strict: true`）类型安全保障
