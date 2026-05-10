# direct-fix-mode Specification

## Purpose
建立 Advisor 的 DIRECT_FIX 模式，在满足特定条件时允许 Advisor 直接修改代码，替代默认的"仅输出报告"行为。

## ADDED Requirements

### Requirement: Advisor 默认处于 REVIEW 模式
`relay-reviewer` skill SHALL 默认以 REVIEW 模式运行，只输出 `REVIEW_REPORT`，不直接修改代码。

#### Scenario: 默认行为
- **WHEN** Advisor 以 reviewer 角色启动且未满足 DIRECT_FIX 条件
- **THEN** Advisor SHALL 仅输出问题分析、风险、修复建议、最小 patch 建议和 Prompt For Executor
- **AND** Advisor MUST NOT 修改任何源代码文件

### Requirement: 小型局部 patch 触发 DIRECT_FIX
当修复涉及不超过 3 个文件且总计不超过 30 行时，Advisor SHALL 进入 DIRECT_FIX 模式直接修改代码。

#### Scenario: 单文件小改动
- **WHEN** 修复只需修改 1 个文件且变更少于 20 行
- **THEN** Advisor SHALL 直接修改代码并输出变更摘要

#### Scenario: 多文件小改动
- **WHEN** 修复涉及 2-3 个文件且每文件变更少于 10 行
- **THEN** Advisor SHALL 直接修改代码并输出变更摘要

#### Scenario: 超过阈值时保持 REVIEW 模式
- **WHEN** 修复涉及超过 3 个文件或总计超过 30 行
- **THEN** Advisor SHALL 保持 REVIEW 模式，输出 REVIEW_REPORT 委派给 Executor

### Requirement: Executor 连续失败触发 DIRECT_FIX
当同一任务 Executor 连续失败次数达到 3 次时，Advisor SHALL 进入 DIRECT_FIX 模式。

#### Scenario: 连续失败 3 次
- **WHEN** `state.json.executorFailures.currentTask >= 3`
- **THEN** Advisor SHALL 直接修改代码，不再委派

#### Scenario: 失败次数未达阈值
- **WHEN** `state.json.executorFailures.currentTask < 3`
- **THEN** Advisor SHALL 保持 REVIEW 模式，在 ADVISOR_DECISION 或 REVIEW_REPORT 中提供 Prompt For Executor

### Requirement: 架构级问题有条件触发 DIRECT_FIX
当 Advisor 判断问题属于架构级（路由、数据模型、状态管理、安全架构）时，Advisor SHALL 先输出架构分析，获得用户确认后方可进入 DIRECT_FIX 模式。

#### Scenario: 架构级问题先分析
- **WHEN** Advisor 识别到架构级问题
- **THEN** Advisor SHALL 先输出架构分析文档（包含问题、影响面、修改方案）
- **AND** Advisor MUST NOT 在未获确认前修改代码

#### Scenario: 用户确认后修改
- **WHEN** 用户对架构分析回复确认（"可以"、"你改吧"等）
- **THEN** Advisor SHALL 进入 DIRECT_FIX 模式并修改代码

### Requirement: 用户显式要求触发 DIRECT_FIX
当用户显式要求 Advisor 接管修复时（如"你直接改"、"你来修"、`/relay:fix`），Advisor SHALL 进入 DIRECT_FIX 模式。

#### Scenario: 用户说"你直接改"
- **WHEN** 用户消息包含"你直接改"、"你帮我改"等显式要求
- **THEN** Advisor SHALL 进入 DIRECT_FIX 模式并修改代码

#### Scenario: 用户运行 /relay:fix
- **WHEN** 用户输入 `/relay:fix`
- **THEN** Advisor SHALL 加载 `relay-fixer` skill 并进入 DIRECT_FIX 模式

### Requirement: DIRECT_FIX 模式下的行为约束
进入 DIRECT_FIX 模式后 Advisor SHALL 满足以下约束：

#### Scenario: 修改后输出变更摘要
- **WHEN** Advisor 在 DIRECT_FIX 模式下完成代码修改
- **THEN** Advisor SHALL 输出变更摘要，至少包含：修改的文件列表、每个文件的修改原因

#### Scenario: 完成后切回 REVIEW 模式
- **WHEN** Advisor 完成 DIRECT_FIX 修改
- **THEN** Advisor SHALL 自动切回 REVIEW 模式

#### Scenario: 不可扩大修复范围
- **WHEN** Advisor 在 DIRECT_FIX 模式下修改代码
- **THEN** Advisor MUST NOT 修改超出 bug 修复范围的无关代码

### Requirement: DIRECT_FIX 修改可追踪
系统 SHALL 在 `state.json` 中记录每次 DIRECT_FIX 修改。

#### Scenario: 记录修改日志
- **WHEN** Advisor 在 DIRECT_FIX 模式下完成修改
- **THEN** 系统 SHALL 在 state.json 的 `directFixLog` 追加一条记录，包含时间戳、触发原因、修改文件列表和变更摘要
