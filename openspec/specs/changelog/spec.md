# changelog Specification

## Purpose
TBD - created by archiving change npm-publish-readiness. Update Purpose after archive.
## Requirements
### Requirement: 项目根目录存在 CHANGELOG.md 文件
项目根目录 SHALL 包含 `CHANGELOG.md` 文件，记录所有面向用户的版本变更。

#### Scenario: CHANGELOG.md 文件存在
- **WHEN** 使用者访问项目根目录
- **THEN** 可见 `CHANGELOG.md` 文件

### Requirement: CHANGELOG 记录 v0.1.0 版本变更
`CHANGELOG.md` SHALL 包含 `v0.1.0` 版本条目，列出该版本的主要功能。

#### Scenario: v0.1.0 版本条目存在
- **WHEN** 使用者打开 `CHANGELOG.md`
- **THEN** 可看到以 `## v0.1.0` 开头的版本条目，包含日期和功能列表

