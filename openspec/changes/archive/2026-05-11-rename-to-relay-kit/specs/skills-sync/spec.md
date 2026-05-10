# skills-sync Specification Delta

## MODIFIED Requirements

### Requirement: 同步 advisor Skills
系统 SHALL 提供 `relay sync --skills` 命令，将当前项目 `.relay/skills` 下包含 `SKILL.md` 的 `relay-*` Skill 目录同步到已解析的目标 Skills 目录。

#### Scenario: 默认同步项目级目标
- **WHEN** 用户运行 `relay sync --skills`
- **THEN** 系统 SHALL 从 `.relay/skills` 读取 relay Skills
- **AND** 系统 SHALL 仅同步到 `.relay/config.json` 中启用的项目级 `.claude/skills` 和 `.agents/skills` 目标

#### Scenario: 源目录缺失
- **WHEN** 用户运行 `relay sync --skills` 且 `.relay/skills` 不存在
- **THEN** 系统 SHALL 拒绝同步并提示先运行 `relay init`
