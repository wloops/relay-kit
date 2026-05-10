# cli-rename Specification

## Purpose
将项目从 `ai-advisor-kit` / `advisor` 全面重命名为 `relay-kit` / `relay`，包括 npm 包名、CLI 命令、配置目录、忽略文件、模板引用和注入标记。

## ADDED Requirements

### Requirement: npm 包名为 relay-kit
`package.json` 的 `name` 字段 SHALL 为 `"relay-kit"`。
`package.json` 的 `bin` 字段 SHALL 映射 `relay` 命令到 `./dist/cli.js`。
`package.json` 的 `repository` 字段 SHALL 指向 GitHub 上的 `relay-kit` 仓库。

#### Scenario: 包名正确
- **WHEN** 查看 `package.json` 的 `name` 字段
- **THEN** 其值为 `"relay-kit"`

#### Scenario: CLI 命令正确
- **WHEN** 查看 `package.json` 的 `bin` 字段
- **THEN** 包含 `"relay": "./dist/cli.js"` 映射

#### Scenario: 仓库地址正确
- **WHEN** 查看 `package.json` 的 `repository` 字段
- **THEN** 其 URL 指向 GitHub 上的 `relay-kit` 仓库

### Requirement: CLI 程序名为 relay
CLI 入口程序 `src/cli.ts` SHALL 使用 `"relay"` 作为程序名称和描述中的产品名称。

#### Scenario: CLI 帮助信息显示正确名称
- **WHEN** 用户运行 `relay --help`
- **THEN** 输出包含 `relay` 作为命令名
- **AND** 输出描述包含 `relay` 而非 `advisor`

### Requirement: 配置目录为 .relay/
项目级配置目录 SHALL 为 `.relay/`（原 `.advisor-kit/`），配置文件仍为 `config.json`、`state.json`。

#### Scenario: init 创建 .relay/ 目录
- **WHEN** 用户运行 `relay init`
- **THEN** 系统在项目根目录创建 `.relay/` 目录
- **AND** 系统在 `.relay/` 下创建 `config.json` 和 `state.json`

### Requirement: 忽略文件为 .relayignore
上下文收集的忽略文件 SHALL 为 `.relayignore`（原 `.advisorignore`）。

#### Scenario: 读取忽略规则
- **WHEN** 系统收集 git 上下文
- **THEN** 系统读取 `.relayignore` 中的忽略规则

### Requirement: AGENTS.md 注入标记更新
注入 `AGENTS.md` 的标记 SHALL 使用 `<!-- relay-kit:start -->` 和 `<!-- relay-kit:end -->`。

#### Scenario: 注入标记格式
- **WHEN** `relay init` 注入 AGENTS.md 规则
- **THEN** 注入内容包裹在 `<!-- relay-kit:start -->` 和 `<!-- relay-kit:end -->` 之间

### Requirement: Skill 目录前缀为 relay-
所有 Skill 目录 SHALL 使用 `relay-` 前缀（原 `advisor-`），如 `relay-planner`、`relay-reviewer`。

#### Scenario: Skill 目录命名
- **WHEN** 查看 `skills/` 目录
- **THEN** 所有包含 SKILL.md 的子目录名以 `relay-` 开头

### Requirement: 模板文件引用更新
`templates/` 下的所有模板 SHALL 将产品名称、角色声明、路径引用从 `advisor` 更新为 `relay`。

#### Scenario: 模板不包含旧名称
- **WHEN** 搜索 `templates/` 目录内容
- **THEN** 不包含 `.advisor-kit` 路径引用
- **AND** 不包含 `advisor-kit` 产品名称引用
