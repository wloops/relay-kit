# command-system Specification

## Purpose
引入显式角色切换命令体系，使用 `/relay:` 前缀让模型明确知道自己当前扮演的角色。

## ADDED Requirements

### Requirement: 显式 Advisor 角色命令
系统 SHALL 通过 Skill 文件提供以下持命令：

| 命令              | Skill 文件                          | 角色        |
|-------------------|-------------------------------------|-------------|
| `/relay:plan`     | `skills/relay-planner/SKILL.md`     | 规划顾问    |
| `/relay:review`   | `skills/relay-reviewer/SKILL.md`    | 审查顾问    |
| `/relay:fix`      | `skills/relay-fixer/SKILL.md`       | 修复顾问    |

#### Scenario: 加载 planner skill
- **WHEN** 用户输入 `/relay:plan` 或表达规划需求
- **THEN** 系统加载 `relay-planner` skill
- **AND** 模型以规划顾问角色响应

#### Scenario: 加载 reviewer skill
- **WHEN** 用户输入 `/relay:review` 或表达审查需求
- **THEN** 系统加载 `relay-reviewer` skill
- **AND** 模型以审查顾问角色响应

#### Scenario: 加载 fixer skill
- **WHEN** 用户输入 `/relay:fix` 或表达修复需求
- **THEN** 系统加载 `relay-fixer` skill
- **AND** 模型以修复顾问角色响应

### Requirement: 显式 Executor 角色命令
系统 SHALL 通过 Skill 文件提供 `/relay:run` 命令（对应 `skills/relay-runner/SKILL.md`），用于 Executor 角色会话。

#### Scenario: 加载 runner skill
- **WHEN** 用户输入 `/relay:run`
- **THEN** 系统加载 `relay-runner` skill
- **AND** 模型以执行者（Executor）角色响应

### Requirement: runner 自动检测任务类型
`relay-runner` skill SHALL 自动检测当前 lane 下是否存在 `RESUME_PROMPT.md`。存在时读取 `RESUME_PROMPT.md`（恢复模式），否则读取 `EXECUTOR_TASK.md`（新任务模式）。

#### Scenario: 存在 RESUME_PROMPT.md 时优先读取
- **WHEN** 当前 lane 下同时存在 `EXECUTOR_TASK.md` 和 `RESUME_PROMPT.md`
- **THEN** 系统 SHALL 读取 `RESUME_PROMPT.md` 作为执行依据

#### Scenario: 只存在 EXECUTOR_TASK.md 时读取
- **WHEN** 当前 lane 下只存在 `EXECUTOR_TASK.md`
- **THEN** 系统 SHALL 读取 `EXECUTOR_TASK.md` 作为执行依据

#### Scenario: 两者都不存在时报错
- **WHEN** 当前 lane 下既不存在 `EXECUTOR_TASK.md` 也不存在 `RESUME_PROMPT.md`
- **THEN** 系统 SHALL 提示用户先运行 `relay start` 或 `relay resume`

### Requirement: Skill frontmatter 声明命令触发方式
每个命令 Skill 的 frontmatter `description` SHALL 明确声明其对应的命令和自然语言触发方式。

#### Scenario: reviewer skill 的 description
- **WHEN** 查看 `skills/relay-reviewer/SKILL.md` 的 frontmatter
- **THEN** `description` 包含 `/relay:review` 引用和自然语言描述

### Requirement: 内部衔接 Skill 用户不可见
`relay-delegator` 和 `relay-escalation` skill SHALL 由其他 skill 内部自动衔接触发，不暴露为独立的前端命令。

#### Scenario: planner 自动调用 delegator
- **WHEN** planner 完成规划
- **THEN** planner 自动按 delegator 逻辑在输出末尾生成 EXECUTOR_TASK

#### Scenario: escalation 由上下文自动触发
- **WHEN** runner 生成 ASK_ADVISOR.md 后用户回到 Advisor 会话
- **THEN** Advisor 检测到 ASK_ADVISOR.md 存在时自动以 escalation 角色响应
