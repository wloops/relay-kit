# Changelog

## 0.3.1 (2026-05-11)

### Changed

- `relay init` 交互提示中文化（模式选择、外部 CLI 检测）

## 0.3.0 (2026-05-11)

### Added

- **吸收 OpenSpec CLI 为内置实现**：`relay openspec` 子命令组，不再依赖外部 `openspec` 二进制
  - `relay openspec new-change <name>` — 创建 change 目录
  - `relay openspec status --change <name>` — 查看 artifact 完成状态
  - `relay openspec list` — 列出活跃 changes
  - `relay openspec instructions <artifact> --change <name>` — 获取 artifact 创建指引
  - `relay openspec apply-instructions --change <name>` — 获取 apply 执行指引
  - `relay openspec archive <name>` — 归档已完成的 change
  - `relay openspec schemas` — 列出可用 schema
- `relay sync --openspec` — 同步 OpenSpec 命令/Skill 文件到项目
- `relay sync --all` — 一键同步 relay skills + OpenSpec 文件

### Changed

- `relay init` 交互式选择模式（检测到无 `openspec/` 时弹出菜单）
- `relay init --mode openspec` 自动创建 `openspec/` 目录结构（不再报错）
- `relay init` 检测外部 `openspec` CLI 并提供选项（使用内置 / 使用外部 / 跳过）
- `relay sync` 现在需要显式指定 `--skills`、`--openspec` 或 `--all`
- 增强 `relay-planner`、`relay-runner`、`relay-delegator` 的 OpenSpec 集成指引

### Migration

1. 如已安装外部 `openspec` CLI：`relay init --openspec-sync use_relay` 切换到内置实现
2. 运行 `relay sync --all` 更新项目中的 OpenSpec 文件

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
