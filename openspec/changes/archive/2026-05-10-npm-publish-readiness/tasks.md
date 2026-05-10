## 1. package.json 元数据补充

- [x] 1.1 新增 `types` 字段，值为 `"./dist/cli.d.ts"`
- [x] 1.2 新增 `repository` 字段，指向 GitHub 仓库地址（待确认后填入）

## 2. package.json 脚本补充

- [x] 2.1 新增 `prepublishOnly` 脚本：`"prepublishOnly": "pnpm build"`
- [x] 2.2 新增 `typecheck` 脚本：`"typecheck": "tsc --noEmit"`

## 3. CHANGELOG.md 创建

- [x] 3.1 在项目根目录创建 `CHANGELOG.md`
- [x] 3.2 写入 `## v0.1.0` 版本条目，包含日期和初始功能列表

## 4. 验证

- [x] 4.1 运行 `pnpm typecheck` 确认类型检查通过
- [x] 4.2 运行 `pnpm build` 确认构建成功
- [x] 4.3 运行 `pnpm test` 确认 27 个测试全部通过
- [x] 4.4 运行 `npm pack --dry-run` 确认包内容正确
- [x] 4.5 创建 git tag `v0.1.0`
