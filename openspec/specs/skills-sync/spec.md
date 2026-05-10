# skills-sync Specification

## Purpose
TBD - created by archiving change add-skills-sync. Update Purpose after archive.
## Requirements
### Requirement: 同步 relay Skills
系统 SHALL 提供 `relay sync --skills` 命令，将当前项目 `.relay/skills` 下包含 `SKILL.md` 的 `relay-*` Skill 目录同步到已解析的目标 Skills 目录。

#### Scenario: 默认同步项目级目标
- **WHEN** 用户运行 `relay sync --skills`
- **THEN** 系统 SHALL 从 `.relay/skills` 读取 relay Skills
- **AND** 系统 SHALL 仅同步到 `.relay/config.json` 中启用的项目级 `.claude/skills` 和 `.agents/skills` 目标

#### Scenario: 源目录缺失
- **WHEN** 用户运行 `relay sync --skills` 且 `.relay/skills` 不存在
- **THEN** 系统 SHALL 拒绝同步并提示先运行 `relay init`

### Requirement: 支持目标和作用域参数
系统 SHALL 支持 `--target claude|codex|all` 和 `--scope project|user` 参数解析同步目标。

#### Scenario: 指定 Claude 项目级目标
- **WHEN** 用户运行 `relay sync --skills --target claude --scope project`
- **THEN** 系统 SHALL 只同步到 `.claude/skills`

#### Scenario: 指定 Codex 项目级目标
- **WHEN** 用户运行 `relay sync --skills --target codex --scope project`
- **THEN** 系统 SHALL 只同步到 `.agents/skills`
- **AND** 系统 MUST NOT 使用 `.codex/skills` 作为默认目录

#### Scenario: 指定全部用户级目标
- **WHEN** 用户运行 `relay sync --skills --target all --scope user`
- **THEN** 系统 SHALL 同步到 `~/.claude/skills` 和 `~/.agents/skills`

### Requirement: 用户级写入必须显式选择
系统 MUST NOT 在未显式传入 `--scope user` 时写入 `~/.claude/skills` 或 `~/.agents/skills`。

#### Scenario: 默认命令不写用户级目录
- **WHEN** 用户运行 `relay sync --skills`
- **THEN** 系统 MUST NOT 创建或修改 `~/.claude/skills`
- **AND** 系统 MUST NOT 创建或修改 `~/.agents/skills`

#### Scenario: 用户级作用域缺少有效目标
- **WHEN** 用户运行 `relay sync --skills --scope user` 且配置未启用任何用户级目标
- **THEN** 系统 SHALL 拒绝同步并提示使用 `--target` 明确选择目标

### Requirement: 保护用户修改
系统 SHALL 默认避免覆盖目标目录中疑似被用户修改过的 Skill 文件，除非用户显式传入 `--force`。

#### Scenario: 目标文件有未记录修改
- **WHEN** 目标 Skill 文件存在且内容不同于源文件，并且同步状态不能证明该文件未被用户修改
- **THEN** 系统 SHALL 将该文件标记为 `conflict`
- **AND** 系统 MUST NOT 覆盖该文件

#### Scenario: force 覆盖冲突文件
- **WHEN** 用户运行带 `--force` 的同步命令且目标文件被标记为 `conflict`
- **THEN** 系统 SHALL 使用源文件覆盖目标文件
- **AND** 系统 SHALL 更新同步状态记录

### Requirement: dry-run 不写入
系统 SHALL 支持 `--dry-run`，只输出同步计划，不对文件系统产生写入。

#### Scenario: dry-run 预览同步
- **WHEN** 用户运行 `relay sync --skills --dry-run`
- **THEN** 系统 SHALL 输出将要创建、更新、跳过或冲突的文件
- **AND** 系统 MUST NOT 创建目标目录
- **AND** 系统 MUST NOT 复制文件
- **AND** 系统 MUST NOT 更新同步状态

### Requirement: 输出同步报告
系统 SHALL 在同步完成或 dry-run 预览后输出同步报告，展示目标、动作和汇总结果。

#### Scenario: 报告包含动作汇总
- **WHEN** 同步命令完成
- **THEN** 系统 SHALL 输出 source、target、scope、dry-run 状态和每类 action 的数量
- **AND** 系统 SHALL 标出每个冲突文件的目标路径
