# 使用流程

## 1. 第一次接入项目

```bash
relay init
```

如果没有 OpenSpec，会让用户选择：

```text
1. Simple 模式：不使用 OpenSpec
2. OpenSpec 模式：已有 OpenSpec，接入即可
3. 引导初始化 OpenSpec：只提示/确认，不静默安装
```

初始化后生成：

```text
.relay/
  config.json
  state.json
  skills/

docs/
  agent-handoffs/
    runs/

AGENTS.md
```

## 2. 规划功能

对聪明模型说：

```text
用 relay-planner 帮我规划「本地项目存储」功能。
请判断是否需要 OpenSpec，明确目标、范围、非目标，并拆成 tasks。
```

如果是中大型功能，建议输出：

```text
openspec/changes/add-local-project-storage/
  proposal.md
  design.md
  tasks.md
```

## 3. 委派给小模型

对聪明模型说：

```text
用 relay-delegator 把当前 OpenSpec change 的第 1-2 项交给 OpenCode。
```

Skill 底层调用或建议：

```bash
relay start
```

生成：

```text
docs/agent-handoffs/runs/<run-id>/lanes/main/EXECUTOR_TASK.md
```

把 `EXECUTOR_TASK.md` 交给 OpenCode。

## 4. 小模型卡住

```bash
relay ask
```

生成 `ASK_ADVISOR.md`，交给聪明模型：

```text
用 relay-escalation 分析这个 ASK_ADVISOR，输出 ADVISOR_DECISION。
```

## 5. 顾问给出决策后继续

保存顾问回复为 `ADVISOR_DECISION.md`，运行：

```bash
relay resume
```

生成 `RESUME_PROMPT.md`，交给 OpenCode 继续。

## 6. 完成后 Review

```bash
relay review
```

生成 `REVIEW_REQUEST.md`，交给聪明模型：

```text
用 relay-reviewer review 当前实现。
不要直接改代码，先输出 REVIEW_REPORT。
```

## 7. 最简心智模型

```text
planner：规划
delegator：委派
executor：执行
escalation：卡住求助
resume：继续执行
reviewer：审查
```
