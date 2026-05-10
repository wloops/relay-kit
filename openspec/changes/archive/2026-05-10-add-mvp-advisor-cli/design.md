## Context

当前仓库已经具备 npm 包骨架、`commander` CLI 入口、6 个 MVP 命令占位文件、模板目录和 advisor Skills 草案。方案文档明确了产品定位：OpenSpec 管“做什么”，advisor-kit 管“怎么交给小模型、卡住怎么求助、完成怎么 review”，OpenCode / Claude Code / Codex 等工具负责实际执行。

MVP 的设计目标是把这套流程落成一个保守的本地 CLI：只生成规则、上下文和 handoff 文件，不自动调用模型，不自动执行 Executor，不自动提交 git。

## Goals / Non-Goals

**Goals:**

- 提供 6 个 MVP 命令：`init`、`start`、`ask`、`resume`、`review`、`doctor`。
- 让没有 OpenSpec 的项目可以使用 simple 模式。
- 让已有 OpenSpec 的项目可以读取 change 文档并生成 bounded handoff。
- 默认安装项目级 Skills 到 `.advisor-kit/skills`、`.claude/skills`、`.agents/skills`。
- 使用 run/lane 目录结构沉淀每次任务，即使 MVP 只默认使用 `main` lane。
- 用最小 `state.json` 记录当前 run、lane、mode、change 和更新时间。
- 对敏感文件和大目录执行统一排除，避免把密钥或大型构建产物写入 handoff 文件。

**Non-Goals:**

- 不实现 `advisor sync`、`advisor clean`、`advisor lane`、`advisor docs`。
- 不自动调用模型 API。
- 不自动执行 OpenCode、Claude Code、Codex 或其他 Executor。
- 不自动提交 git。
- 不提供 GUI。
- 不默认安装用户级 Skills。
- 不静默安装 OpenSpec，也不静默创建目标项目的 `openspec/`。

## Decisions

### 1. CLI 命令边界

MVP 只注册并实现以下命令：

```bash
advisor init
advisor start
advisor ask
advisor resume
advisor review
advisor doctor
```

各命令职责如下：

- `advisor init`：检测项目、选择 simple/openspec 模式、生成 `.advisor-kit/config.json` 与 `.advisor-kit/state.json`、创建 handoff 根目录、注入 `AGENTS.md` advisor 规则、导出项目级 Skills。
- `advisor start`：开始一次 run，创建 `docs/agent-handoffs/runs/<runId>/lanes/main/`，并生成 `EXECUTOR_TASK.md`。
- `advisor ask`：在 Executor 卡住时收集 git 状态、diff 摘要、当前任务、可选的 build/test 输出，并生成 `ASK_ADVISOR.md`。
- `advisor resume`：读取 `ADVISOR_DECISION.md` 或指定输入，生成给 Executor 的 `RESUME_PROMPT.md`。
- `advisor review`：收集当前 diff 与任务上下文，生成 `REVIEW_REQUEST.md`。
- `advisor doctor`：检查配置、规则注入、Skills、handoff 目录、OpenSpec 状态、package scripts、当前 run/lane 和未处理 handoff 文件。

`advisor sync`、`advisor clean`、`advisor lane`、`advisor docs` 在现有方案中出现过，但不进入本次 MVP。这样可以先交付稳定的单线 handoff 流程，避免把 Skills 更新、清理策略、并行 lane 管理和文档沉淀提前耦合进第一版。

### 2. Skills 安装策略

`advisor init` 默认写入项目级 Skills：

```text
.advisor-kit/skills   advisor-kit 管理副本，必选
.claude/skills        Claude Code 项目级 Skills
.agents/skills        Codex 项目级 Skills
```

MVP 默认导出 4 个 Skills：

```text
advisor-planner
advisor-delegator
advisor-escalation
advisor-reviewer
```

以下 Skills 作为后续增强，不在 MVP 默认安装范围：

```text
advisor-lane-planner
advisor-docs
```

不默认写入用户级目录：

```text
~/.claude/skills
~/.agents/skills
```

原因是用户级 Skills 会影响用户所有项目，MVP 默认应保持项目隔离。未来若实现用户级安装，必须由显式选项触发，并在覆盖前提示用户。

### 3. simple/OpenSpec 模式

`advisor init` 根据目标项目状态选择模式：

- 检测到 `openspec/` 和基础结构时，建议 `openspec` 模式。
- 未检测到 OpenSpec 时，默认允许使用 `simple` 模式。
- 用户传入 `--mode simple` 时，直接按 simple 模式初始化 advisor-kit。
- 用户传入 `--mode openspec` 时，只在已存在 OpenSpec 基础结构时启用；缺失时应提示用户处理。
- 用户传入 `--with-openspec` 时，只做引导说明和确认流程，不能静默安装 OpenSpec，也不能静默创建 `openspec/`。

OpenSpec 集成边界：

- `advisor start` 可以读取 `proposal.md`、`design.md`、`tasks.md`，并把选定任务转成 Executor handoff。
- `advisor ask` 可以把当前 change、任务和相关 OpenSpec 文档摘要放入求助包。
- `advisor review` 可以把实现 diff 与 OpenSpec 范围一起交给 Advisor review。
- advisor-kit 不替代 `/opsx:apply`，也不自动执行 OpenSpec change。

### 4. run/lane 结构

MVP 使用 run/lane 结构，但只默认使用 `main` lane：

```text
docs/agent-handoffs/
  runs/
    <YYYY-MM-DD-slug>/
      RUN.md
      TASK_BOARD.md
      lanes/
        main/
          EXECUTOR_TASK.md
          ASK_ADVISOR.md
          ADVISOR_DECISION.md
          RESUME_PROMPT.md
          REVIEW_REQUEST.md
          REVIEW_REPORT.md
      history/
```

保留 `lanes/main/` 是为了未来支持并行时不需要迁移历史文件；但 MVP 不提供 `advisor lane` 命令，也不自动规划或创建多 lane。

### 5. state.json 最小 schema

MVP 的 `.advisor-kit/state.json` 只使用以下 schema：

```json
{
  "currentRun": "",
  "currentLane": "main",
  "mode": "simple",
  "currentChange": "",
  "updatedAt": ""
}
```

字段含义：

- `currentRun`：当前 runId；没有活动 run 时为空字符串。
- `currentLane`：当前 lane；MVP 默认是 `main`。
- `mode`：`simple` 或 `openspec`。
- `currentChange`：OpenSpec 模式下当前 change；simple 模式为空字符串。
- `updatedAt`：最近一次状态更新时间，使用 ISO 字符串。

保持 schema 最小可以降低第一版迁移和兼容风险。后续如果需要扩展，必须保持向后兼容。

### 6. 文件生成规则

生成文件必须遵守以下规则：

- 默认使用 UTF-8 文本。
- 写入前创建必要目录。
- 默认不覆盖用户已有内容；需要覆盖时必须有 `--force` 或明确确认。
- `AGENTS.md` 注入使用 `<!-- advisor-kit:start -->` 与 `<!-- advisor-kit:end -->` 包裹，确保可重复运行且不会破坏用户原有规则。
- handoff 文件使用模板渲染，模板缺失时应给出明确错误。
- 生成路径必须限制在当前项目内，避免写到项目外路径。
- 上下文收集、文件扫描和 diff 摘要必须排除以下敏感文件与大目录：

```text
.env
.env.*
node_modules
dist
build
coverage
```

`advisor ask` 默认不运行任何构建或测试命令。只有用户显式传入以下参数时才执行：

```bash
advisor ask --run build
advisor ask --run test
```

执行 build/test 时，只使用项目中可检测到的 package script 或配置命令；命令失败也不自动修复，只把输出收集进 `ASK_ADVISOR.md`。

## Risks / Trade-offs

- [Risk] OpenSpec schema 可能要求 specs artifact，但本次用户只要求创建 proposal/design/tasks。  
  Mitigation: 本 change 文档先按指定文件范围生成，并在后续实现前补齐 spec delta 或确认是否采用轻量 proposal-only 流程。
- [Risk] 默认写入 `.claude/skills` 和 `.agents/skills` 可能触碰团队不希望提交的工具目录。  
  Mitigation: 默认安装仍为项目级；实现时应允许交互取消具体目标，并在文档中说明可只提交 `.advisor-kit/skills`。
- [Risk] `advisor ask --run build/test` 可能产生很长输出。  
  Mitigation: 对日志做截断，并保留失败命令、退出码和关键尾部输出。
- [Risk] run/lane 结构比单文件输出复杂。  
  Mitigation: MVP 固定 `main` lane，不暴露 lane 管理命令，只保留目录兼容性。

## Open Questions

- 是否需要为 `mvp-advisor-cli` 立即补充 `specs/mvp-advisor-cli/spec.md`，以满足当前 OpenSpec `spec-driven` schema 的 apply 依赖？
- `advisor review` 是否允许显式 `--run build/test`，还是只收集当前 diff 与 handoff 上下文？MVP 方案当前只明确了 `advisor ask --run build/test`。
