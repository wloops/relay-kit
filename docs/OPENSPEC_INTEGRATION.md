# OpenSpec 集成架构

## 1. v0.3.0 起：内置实现

relay-kit v0.3.0 起**不再依赖外部 `openspec` CLI**。所有 OpenSpec 功能由 relay-kit 内置实现：

```text
relay-kit CLI
├── relay init              → 一键创建 openspec/ + .relay/
├── relay openspec *        → 内置 OpenSpec CLI（零外部依赖）
├── relay start --change    → 读取 OpenSpec change 生成 EXECUTOR_TASK
├── relay sync --openspec   → 同步 OpenSpec 命令/Skill 文件
└── relay sync --all        → 全量同步（Skills + OpenSpec）
```

## 2. 架构角色

```text
OpenSpec 的工作由 relay-kit 接管：
  - 定义「做什么」→ schema + artifacts（proposal / specs / design / tasks）
  - 跟踪「做了多少」→ status / task progress
  - 归档「做完了」→ archive + spec merge

relay-kit 的工作流层：
  - 规划 → /relay:plan → 输出 PLAN_REPORT
  - 交付 → relay start → EXECUTOR_TASK.md
  - 执行 → /relay:run → 小步实现，卡住升级
  - 求助 → relay ask → ASK_ADVISOR.md
  - 审查 → relay review → REVIEW_REQUEST.md
```

## 3. 内置 Schema

relay-kit 内置 `spec-driven` schema（唯一实际使用的 schema），artifact 流：

```
proposal ──→ specs ──→ tasks
    │                      ↑
    └──────→ design ───────┘

apply.requires: [tasks]
apply.tracks: tasks.md
```

Schema 定义在 `src/core/schema.ts`，支持轻量扩展框架。

## 4. 与外部 openspec CLI 共存

如果系统已有外部 `openspec` CLI（如 `@fission-ai/openspec`）：

- `relay init` 检测到后提供选项：使用内置 / 使用外部 / 跳过
- `--openspec-sync use_relay` 强制使用内置
- 内置实现完全兼容 OpenSpec 文件格式（proposal.md / design.md / tasks.md / delta spec）

## 5. 用户项目中的文件

relay-kit 分发的 OpenSpec 文件（`relay sync --openspec` 安装）：

```text
.opencode/commands/opsx-*.md        # OpenCode 命令
.opencode/skills/openspec-*/        # OpenCode Skills
.claude/commands/opsx/*.md          # Claude Code 命令
.claude/skills/openspec-*/          # Claude Code Skills
.codex/skills/openspec-*/           # Codex Skills
```

这些文件内部调用 `relay openspec` 而非外部 `openspec` CLI。

## 6. 更新机制

用户更新 relay-kit 后：

```bash
npm update -g relay-kit
relay sync --all     # 全量更新 Skills + OpenSpec 文件
```

relay-kit 作为 OpenSpec 实现的**独立分叉**维护，可按需从上游合并指令优化，也可自主微调。

## 7. 与 /opsx:* 命令的关系

`/opsx:propose`、`/opsx:apply`、`/opsx:archive`、`/opsx:explore` 命令由 relay-kit 分发，内部调用 `relay openspec` 子命令，完全自包含。
