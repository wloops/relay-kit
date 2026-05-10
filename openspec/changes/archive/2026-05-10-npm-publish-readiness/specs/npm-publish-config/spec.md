## ADDED Requirements

### Requirement: package.json 具备 npm 发布所需的标准字段
`package.json` SHALL 包含 `types` 字段，指向 `./dist/cli.d.ts`。
`package.json` SHALL 包含 `repository` 字段，指向项目的 GitHub 仓库地址。

#### Scenario: types 字段指向正确的类型声明文件
- **WHEN** 使用者查看 `package.json` 的 `types` 字段
- **THEN** 该字段的值为 `"./dist/cli.d.ts"`

#### Scenario: repository 字段指向正确的仓库地址
- **WHEN** 使用者查看 `package.json` 的 `repository` 字段
- **THEN** 该字段包含 GitHub 仓库地址

### Requirement: prepublishOnly 脚本自动执行构建
`package.json` 的 `scripts` SHALL 包含 `prepublishOnly` 脚本，在执行 `npm publish` 前自动运行 `build`。

#### Scenario: npm publish 前自动构建
- **WHEN** 执行 `npm publish`（或 `pnpm publish`）
- **THEN** 系统在打包前自动执行 `pnpm build`，确保 `dist/` 包含最新构建产物

### Requirement: typecheck 脚本提供类型检查命令
`package.json` 的 `scripts` SHALL 包含 `typecheck` 脚本，使用 `tsc --noEmit` 执行 TypeScript 类型检查。

#### Scenario: 执行类型检查
- **WHEN** 开发者运行 `pnpm typecheck`
- **THEN** TypeScript 编译器对所有源文件进行类型检查，不生成输出文件

#### Scenario: 类型错误导致检查失败
- **WHEN** 源文件中存在类型错误
- **THEN** `pnpm typecheck` 以非零退出码退出并报告错误
