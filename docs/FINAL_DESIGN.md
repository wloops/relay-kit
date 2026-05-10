# 最终方案：ai-advisor-kit

## 1. 产品一句话

`ai-advisor-kit` 是一个面向 AI 编程的 **Advisor Strategy 工作流工具包**，通过 Skills、CLI、规则文档和 handoff 文件，帮助开发者把任务安全地交给小模型执行，并在卡住或完成时交给聪明模型决策与 Review。

## 2. 解决的问题

AI 编程常见问题：

1. 小模型卡住后反复猜测，越改越乱；
2. 不同 AI 工具之间缺少稳定交接协议；
3. 需求、任务、报错、diff、决策散落在聊天记录里；
4. 大模型全程执行成本高，但关键决策又必须依赖大模型；
5. 多个项目复用流程困难；
6. 并行 Agent 开发容易互相覆盖文件。

`ai-advisor-kit` 通过如下机制解决：

```text
AGENTS.md 约束 Executor
advisor-* Skills 约束 Advisor
advisor CLI 收集上下文
handoff markdown 文件沉淀过程
run / lane 结构支持后续并行
```

## 3. 总体架构

```text
用户自然语言
  ↓
advisor-* Skills
  ↓
advisor CLI
  ↓
handoff files
  ↓
OpenCode / Claude Code / Codex / 其他 Executor
  ↓
git diff / build / test
  ↓
Advisor Review
```

## 4. 分层设计

### 4.1 规则层

`AGENTS.md` 注入 advisor-kit 规则，主要约束小模型 / Executor：

- 小步执行；
- 不扩大范围；
- 不引入依赖；
- 不大规模重构；
- 连续失败 2 次必须停止；
- 需要改架构 / 状态 / 数据模型时必须 ask；
- 完成后必须说明修改文件和验证方式。

### 4.2 Skills 层

`advisor-*` Skills 约束聪明模型 / Advisor：

- `advisor-planner`：规划、判断 simple/OpenSpec、拆 tasks；
- `advisor-delegator`：把任务委派给小模型，生成执行说明；
- `advisor-escalation`：分析求助包，输出决策；
- `advisor-reviewer`：Review 当前实现；
- `advisor-lane-planner`：后续支持并行 lane；
- `advisor-docs`：后续支持进度和文档沉淀。

### 4.3 CLI 层

CLI 是底层能力，不要求用户记复杂参数。

```bash
advisor init      # 初始化项目
advisor start     # 开始任务，生成 EXECUTOR_TASK.md
advisor ask       # 卡住时生成 ASK_ADVISOR.md
advisor resume    # 顾问回复后生成继续执行提示
advisor review    # 完成后生成 REVIEW_REQUEST.md
advisor doctor    # 检查接入状态
```

### 4.4 Handoff 文件层

每次任务都会沉淀为文件：

```text
EXECUTOR_TASK.md
ASK_ADVISOR.md
ADVISOR_DECISION.md
RESUME_PROMPT.md
REVIEW_REQUEST.md
REVIEW_REPORT.md
```

### 4.5 OpenSpec 适配层

- 没有 OpenSpec：simple 模式；
- 检测到 OpenSpec：启用 openspec 模式；
- 用户选择“引导初始化”：只提示和确认，不静默安装；
- 不替代 `/opsx:apply`，只负责任务交接与求助。

## 5. 最重要的边界

`advisor-kit` 不做：

1. 不自动调用大模型 API；
2. 不自动写业务代码；
3. 不自动提交 git；
4. 不替代 OpenCode / Claude Code；
5. 不强制安装 OpenSpec；
6. 不静默初始化 OpenSpec；
7. MVP 不做 GUI；
8. MVP 不做真正自动多 Agent 调度。

它做的是：初始化规则、生成任务交接材料、收集求助上下文、规范 Advisor 输出、生成 Review 请求、让流程跨项目复用。

## 6. Skills 安装策略

`advisor init` 默认采用项目级安装：

```text
.advisor-kit/skills   管理副本，必选
.claude/skills        Claude Code 项目级
.agents/skills        Codex 项目级
```

不默认安装用户级 Skills：

```text
~/.claude/skills
~/.agents/skills
```

用户级只在用户明确选择时安装。

这样可以避免污染所有项目，同时保证每个项目都能携带自己的 advisor 工作流。

完整规则见：

```text
docs/SKILLS_INSTALLATION.md
```
