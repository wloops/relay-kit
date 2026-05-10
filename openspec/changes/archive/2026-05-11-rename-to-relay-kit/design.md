## Context

当前 `ai-advisor-kit` 的命名以 Advisor（顾问）为中心，但系统本质是 Advisor + Executor 双角色接力协作。缺乏显式角色切换机制——模型通过 Skill 描述的模糊匹配自动加载角色信息，不可靠；Advisor 的代码修改权限仅有一句"除非明确要求不要改"的软约束。

本次变更将项目重命名为 `relay-kit`，引入显式命令体系，并建立 Advisor 分级授权机制。

## Goals / Non-Goals

**Goals:**
- 统一品牌命名：`relay-kit` 包名、`relay` CLI、`/relay:` 命令前缀
- 引入显式角色命令：`/relay:plan`、`/relay:run`、`/relay:review`、`/relay:fix`
- 建立 Advisor DIRECT_FIX 模式的 4 条件授权机制
- `/relay:run` 自动检测读取 EXECUTOR_TASK.md 或 RESUME_PROMPT.md
- delegate 和 escalate 环节由 Skill 内部自动衔接，减少用户操作
- `state.json` 扩展以追踪 `advisorMode`、失败次数、修复记录

**Non-Goals:**
- 不改动现有 handoff 文件流的核心结构（EXECUTOR_TASK → ASK → DECISION → RESUME → REVIEW）
- 不引入新的外部依赖
- 不改变 Skill 安装机制（skill 文件的发现、复制、sync 逻辑不变）
- 不改变上下文安全（脱敏、ignore）逻辑
- 不支持自动模型路由（如检测 escalation 自动切换工具）

## Decisions

### 决策 1：命名策略 — 全量替换

**选择**：包名、CLI 命令、目录、常量、模板引用全部替换为 `relay` / `relay-kit`。

```
旧名                             新名
──────────────────────────────────────────────────
ai-advisor-kit (npm)            relay-kit
advisor (CLI)                   relay
.advisor-kit/                    .relay/
.advisorignore                   .relayignore
<!-- advisor-kit:start -->       <!-- relay-kit:start -->
advisor-* (skill 目录前缀)        relay-*
openspec/changes/**              不变（不重命名旧 change）
```

**替代方案**：渐进式别名（保留 `advisor` 作为 `relay` 的别名）。否定原因：增加复杂度，且 v0.1.0 是 alpha 版本无历史包袱。

### 决策 2：命令体系 — Skill 即命令

**选择**：每个 `/relay:*` 命令对应一个 SKILL.md 文件。Skill 的 `description` frontmatter 明确声明触发方式。

```
Skill 文件                        触发命令
─────────────────────────────────────────────────
skills/relay-planner/SKILL.md     /relay:plan
skills/relay-runner/SKILL.md      /relay:run
skills/relay-reviewer/SKILL.md    /relay:review
skills/relay-fixer/SKILL.md       /relay:fix
skills/relay-delegator/SKILL.md   (内部，由 planner 自动衔接)
skills/relay-escalation/SKILL.md  (内部，由 run 自动衔接)
```

Skill frontmatter 示例：
```yaml
---
name: relay-reviewer
description: 代码审查。当用户运行 /relay:review 或要求审查实现时使用。
---
```

**替代方案**：在 AGENTS.md 中注入命令解析逻辑。否定原因：依赖模型自行解析，不如 Skill 机制可靠。

### 决策 3：DIRECT_FIX 模式 — 条件门 + 状态追踪

**选择**：Advisor 默认处于 REVIEW 模式（只输出报告）。满足以下任一条件时进入 DIRECT_FIX 模式：

```
条件                          检测方式
────────────────────────────────────────────────
1. 小型局部 patch             模型自行判断：≤3 文件，≤30 行
2. Executor 连续失败           state.json.executorFailures ≥ 3
3. 架构级问题                 模型判断 + 先输出分析获确认后再动手
4. 用户显式要求               用户说 "你直接改" 或运行 /relay:fix
```

状态追踪扩展（`state.json` 新增字段）：
```json
{
  "advisorMode": "review",
  "executorFailures": { "currentTask": 0, "totalEscalations": 0 },
  "directFixLog": [
    { "timestamp": "...", "reason": "small_patch", "files": ["..."], "summary": "..." }
  ]
}
```

进入 DIRECT_FIX 后：
- 可以直接修改代码
- 修改后输出变更摘要（文件、原因）
- 完成后自动切回 REVIEW 模式

**替代方案**：始终允许 Advisor 修改代码。否定原因：模糊边界导致行为不可预测，与"顾问"定位冲突。

### 决策 4：/relay:run 自动检测逻辑

**选择**：Skill 文件内置检测逻辑，优先读 RESUME_PROMPT.md（存在时），否则读 EXECUTOR_TASK.md。

```
/relay:run 触发
      │
      ├── RESUME_PROMPT.md 存在？
      │       │
      │       Yes ──→ 读取 RESUME_PROMPT.md（恢复模式）
      │       No  ──→ 读取 EXECUTOR_TASK.md（新任务模式）
      │
      └── 两者都不存在 → 报错："没有可执行的任务，先运行 relay start 或 relay resume"
```

### 决策 5：内部衔接 — Skill 间自动流转

delegate 和 escalate 环节用户不可见：

```
/relay:plan
  规划完成后 → 自动调用 delegator 逻辑 → 在输出末尾附带 EXECUTOR_TASK
  (用户看到的仍是一个完整输出，不需要后续单独运行 /relay:delegate)

/relay:run
  执行过程中遇阻 → 自动生成 ASK_ADVISOR.md
  用户回到 Advisor 会话 → 告知 Advisor 读取 ASK_ADVISOR.md
  Advisor 自动识别对应 escalation skill
```

**替代方案**：保留 `/relay:delegate` 和 `/relay:escalate` 命令供手动调用。否定原因：增加用户认知负担，且这两个操作的自然触发时机明确。

### 决策 6：迁移兼容 — 不做自动迁移

**选择**：这是 BREAKING CHANGE，v0.1.0 是 alpha 版本，不提供自动迁移工具。用户需手动删除旧的 `.advisor-kit/` 目录重新 `relay init`。

在 CHANGELOG 中明确标注迁移步骤。

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| GitHub 仓库 `relay-kit` 与 `relayprotocol/relay-kit` 并存，搜索时可能混淆 | 用户搜索时加上 org 前缀 `wloops/relay-kit`；SEO 靠 npm 和 README |
| npm 上 `relay` bin 名可能与 `ai-relay`、`relay-dev` 等包冲突 | 用户安装多个 relay 系列包时需要自行管理；我们的 CLI 不与它们功能重叠 |
| DIRECT_FIX 模式下 Advisor 可能越权修改 | 条件 1 行数/文件数阈值硬约束在 Skill 规则中；state.json 追踪每次修改 |
| 全量重命名可能遗漏引用 | tasks 中逐一检查：package.json、源码、模板、skill、文档、常量 |

## Migration Plan

1. 新用户直接 `npm install relay-kit && relay init`
2. 已有项目用户：
   - 删除 `.advisor-kit/` 目录
   - 删除 `.advisorignore`（如存在）
   - 删除 `.claude/skills/advisor-*`、`.agents/skills/advisor-*`
   - 移除 `AGENTS.md` 中 `<!-- advisor-kit:start -->` 到 `<!-- advisor-kit:end -->` 之间的内容
   - 运行 `relay init` 重新初始化
3. 回滚：安装旧版本 `npm install ai-advisor-kit@0.1.0`

## Open Questions

- `relay-lane-planner`、`relay-docs` 两个预留 Skill 是否需要在本 change 中一并重命名？（建议：是，保持统一）
- GitHub 仓库名是否在本次 change 中确定改为 `relay-kit`？（依赖用户决策）
