# state-tracking Specification

## Purpose
扩展 `state.json` 的运行时状态追踪能力，支持 Advisor 模式切换、Executor 失败计数和 DIRECT_FIX 修改记录的追踪。

## ADDED Requirements

### Requirement: 记录当前 Advisor 模式
`state.json` SHALL 包含 `advisorMode` 字段，取值为 `"review"` 或 `"direct_fix"`，默认值为 `"review"`。

#### Scenario: 初始模式
- **WHEN** `relay init` 创建初始 state.json
- **THEN** `advisorMode` 的值为 `"review"`

#### Scenario: 进入 DIRECT_FIX 后更新
- **WHEN** Advisor 进入 DIRECT_FIX 模式
- **THEN** 系统 SHALL 将 `advisorMode` 更新为 `"direct_fix"`

#### Scenario: 退出 DIRECT_FIX 后恢复
- **WHEN** Advisor 退出 DIRECT_FIX 模式
- **THEN** 系统 SHALL 将 `advisorMode` 恢复为 `"review"`

### Requirement: 记录 Executor 失败次数
`state.json` SHALL 包含 `executorFailures` 对象，含 `currentTask`（当前任务失败次数）和 `totalEscalations`（累计 escalation 次数）字段。

#### Scenario: 初始失败计数为零
- **WHEN** `relay start` 创建新 run
- **THEN** `executorFailures.currentTask` 的值为 `0`

#### Scenario: escalation 时递增计数
- **WHEN** Executor 生成 ASK_ADVISOR.md 并触发 escalation
- **THEN** `executorFailures.currentTask` 递增 `1`
- **AND** `executorFailures.totalEscalations` 递增 `1`

### Requirement: 记录 DIRECT_FIX 修改日志
`state.json` SHALL 包含 `directFixLog` 数组，记录每次 DIRECT_FIX 修改的详细信息。

每条记录 SHALL 包含：
- `timestamp`：修改时间（ISO 8601 格式）
- `reason`：触发原因（`"small_patch"` / `"executor_failure"` / `"architecture"` / `"user_request"`）
- `files`：修改的文件路径列表
- `summary`：变更摘要

#### Scenario: DIRECT_FIX 后追加日志
- **WHEN** Advisor 在 DIRECT_FIX 模式下完成代码修改
- **THEN** 系统 SHALL 在 `directFixLog` 数组末尾追加新记录

#### Scenario: 日志包含完整信息
- **WHEN** 查看 `directFixLog` 中的一条记录
- **THEN** 该记录包含 `timestamp`、`reason`、`files`、`summary` 所有字段
