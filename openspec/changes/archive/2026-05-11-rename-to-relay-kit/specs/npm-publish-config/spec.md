# npm-publish-config Specification Delta

## MODIFIED Requirements

### Requirement: package.json 具备 npm 发布所需的标准字段
`package.json` SHALL 包含 `types` 字段，指向 `./dist/cli.d.ts`。
`package.json` SHALL 包含 `repository` 字段，指向项目的 GitHub 仓库地址（`relay-kit` 仓库）。
`package.json` SHALL 包含 `name` 字段，值为 `"relay-kit"`。
`package.json` SHALL 包含 `bin` 字段，值为 `{ "relay": "./dist/cli.js" }`。

#### Scenario: types 字段指向正确的类型声明文件
- **WHEN** 使用者查看 `package.json` 的 `types` 字段
- **THEN** 该字段的值为 `"./dist/cli.d.ts"`

#### Scenario: repository 字段指向正确的仓库地址
- **WHEN** 使用者查看 `package.json` 的 `repository` 字段
- **THEN** 该字段包含 GitHub 仓库地址，指向 `relay-kit` 项目

#### Scenario: name 字段正确
- **WHEN** 使用者查看 `package.json` 的 `name` 字段
- **THEN** 该字段的值为 `"relay-kit"`

#### Scenario: bin 字段正确
- **WHEN** 使用者查看 `package.json` 的 `bin` 字段
- **THEN** 该字段包含 `"relay": "./dist/cli.js"` 映射
