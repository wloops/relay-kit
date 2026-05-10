# ai-advisor-kit 最终方案

`ai-advisor-kit` 是一个 **Skills-first、CLI-assisted** 的 AI 编程工作流工具包。

它不是自动写代码工具，也不是完整多 Agent 框架。它的目标是把 **Advisor Strategy** 固化成一套可复用流程：

```text
小模型 / Executor 负责执行
聪明模型 / Advisor 负责规划、指点、Review
人类 Owner 负责方向、验收、最终提交
```

## 核心定位

```text
OpenSpec 管“做什么”
advisor-kit 管“怎么交给小模型、卡住怎么求助、完成怎么 Review”
OpenCode / Claude Code / Codex 等工具负责实际执行
```

## MVP 命令

```bash
advisor init
advisor start
advisor ask
advisor resume
advisor review
advisor doctor
```

## MVP Skills

```text
advisor-planner
advisor-delegator
advisor-escalation
advisor-reviewer
```

后续增强：

```text
advisor-lane-planner
advisor-docs
```

## 日常使用心智模型

```text
规划任务 → 委派小模型 → 小模型执行 → 卡住求助 → 顾问指点 → 继续执行 → 完成 Review
```

自然语言使用方式：

```text
用 advisor-planner 帮我规划这个功能。
用 advisor-delegator 把当前 change 的第 1-2 项交给 OpenCode。
OpenCode 卡住了，用 advisor-escalation 分析 ASK_ADVISOR。
用 advisor-reviewer review 当前实现。
```

## Skills 安装策略

`advisor init` 默认安装项目级 Skills，不默认安装用户级 Skills。

默认目标：

```text
.advisor-kit/skills   advisor-kit 管理副本，必选
.claude/skills        Claude Code 项目级 Skills
.agents/skills        Codex 项目级 Skills
```

用户级作为高级选项：

```text
~/.claude/skills
~/.agents/skills
```

详细规则见：

```text
docs/SKILLS_INSTALLATION.md
```
