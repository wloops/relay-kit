## Why

当前项目命名为 `ai-advisor-kit`，命令前缀 `advisor`，语义上偏向"顾问"一侧，无法自然覆盖执行器（Executor）角色。同时缺乏显式的角色切换命令体系——模型通过隐式上下文（Skill 描述匹配、文件内容）判断自己角色，不可靠。Advisor 审查后对代码修改的权限边界模糊（仅一句"除非明确要求不要改代码"），需要明确分级授权机制。

## What Changes

- **重命名**：包名 `ai-advisor-kit` → `relay-kit`，CLI 命令 `advisor` → `relay`，品牌统一为 relay（接力隐喻：Advisor 规划 → Executor 执行）
- **命令体系**：引入显式角色命令 `/relay:plan`、`/relay:run`、`/relay:review`、`/relay:fix`，前缀即角色信号
- **DIRECT_FIX 模式**：Advisor 在满足 4 种条件（小型局部 patch、Executor 连续失败、架构级问题、用户显式要求）时可直接修改代码
- **合并 `/relay:run`**：自动检测读取 EXECUTOR_TASK.md 还是 RESUME_PROMPT.md，无需用户关心
- **内部衔接**：delegate、escalate 由 Skill 自动触发，用户无感
- **状态追踪**：扩展 `state.json` 记录 `advisorMode`、`executorFailures` 计数、`directFixLog`
- **BREAKING**：CLI 命令名从 `advisor` 改为 `relay`，所有路径引用（`.advisor-kit/`、`.advisorignore`、`AGENTS.md` 注入标记）同步更新

## Capabilities

### New Capabilities

- **cli-rename**：CLI 命令、包名、目录名、模板引用从 `advisor` 全面迁移到 `relay`
- **command-system**：显式角色切换命令体系（`/relay:plan`、`/relay:run`、`/relay:review`、`/relay:fix`）
- **direct-fix-mode**：Advisor DIRECT_FIX 模式及 4 条件授权机制
- **state-tracking**：扩展运行时状态追踪（模式、失败计数、修复日志）

### Modified Capabilities

- **skills-sync**：Skill 名从 `advisor-*` 改为 `relay-*`，同步逻辑不变但目标路径变更
- **npm-publish-config**：`package.json` 的 `name`、`bin`、`repository` 字段指向新名称

## Impact

- `package.json`：name、bin、repository 字段
- `src/cli.ts`：程序名
- `src/core/`：config.ts（目录常量）、skills.ts（skill 名映射）、constants.ts（默认值）、state.ts（新字段）、types.ts（新类型）
- `src/commands/`：全部命令文件中的提示文本和路径引用
- `templates/`：全部模板文件中的角色声明和路径引用
- `skills/`：目录重命名 `advisor-*` → `relay-*`，内容更新
- `openspec/specs/`：skills-sync、npm-publish-config 的 spec delta
- `.advisor-kit/` → `.relay/`：项目级配置目录重命名
- `.advisorignore` → `.relayignore`
- `AGENTS.md` 注入标记：`<!-- advisor-kit:start -->` → `<!-- relay-kit:start -->`
- 文档：`docs/` 下所有文档
