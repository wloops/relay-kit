## Context

当前项目为 `ai-advisor-kit@0.1.0` alpha 版本，是一个纯 CLI 工具（通过 `commander` 暴露二进制入口）。所有核心功能已开发完毕，27 个测试全部通过。TypeScript 严格模式（`strict: true`）已配置但未串联到脚本中。项目使用 `tsup` 构建，输出到 `dist/`。

当前 `package.json` 缺少以下 npm 标准字段和脚本：
- `types` 字段（指向 `dist/cli.d.ts`）
- `repository` 字段（GitHub 仓库地址）
- `prepublishOnly` 脚本（自动构建+测试门禁）
- `typecheck` 脚本（TypeScript 类型检查）
- `CHANGELOG.md` 文件

这些缺失项阻碍了 npm 发布流程。

## Goals / Non-Goals

**Goals:**
- 在 `package.json` 中补充 `types`、`repository` 字段
- 新增 `prepublishOnly` 脚本，在每次 `npm publish` 之前自动运行 `build` 和 `test`
- 新增 `typecheck` 脚本（`tsc --noEmit`），作为质量检查命令
- 创建 `CHANGELOG.md`，记录 v0.1.0 的初始功能

**Non-Goals:**
- 不修改任何业务代码逻辑
- 不引入 ESLint/Biome 等额外 lint 工具（tsc 的 strict 模式已覆盖类型检查）
- 不配置 CI/CD pipeline
- 不添加 `main`/`exports` 字段（此包纯 CLI 工具，不被 import）

## Decisions

### 1. `typecheck` 使用 `tsc --noEmit` 而非 ESLint/Biome
- **理由**: 项目已有 `tsconfig.json` 且 `strict: true`，零配置即可获得完整的类型安全验证
- **备选**: ESLint/Biome 需要额外依赖和配置文件，对当前纯 TypeScript 项目收益有限

### 2. `prepublishOnly` 而非 `prepublish`
- **理由**: `prepublishOnly` 仅在 `npm publish` 时触发，不会在 `npm install` 本地包时意外执行
- **备选**: `prepublish` 在 `npm install <local-dir>` 时也会触发，可能造成不必要的构建

### 3. `prepublishOnly` 仅运行 `build`，不运行 `test`
- **理由**: 构建是发布的前提（发布 `dist/`），测试可由开发者手动运行或接入 CI。运行测试会显著增加发布等待时间，且对发布的包内容无影响
- **权衡**: 如果希望强制质量门禁，可改为 `"pnpm build && pnpm test"`。当前设计倾向于轻量发布流程

### 4. CHANGELOG 采用手动维护的简单格式
- **理由**: 当前版本少、变更简单，无需引入 `changesets` 或 `standard-version` 等自动化工具
- **备选**: 后续版本数量增多时可考虑自动化

## Risks / Trade-offs

- **[低风险] `dist/cli.d.ts` 内容为空**: CLI 入口无公开导出 API，空 `.d.ts` 对使用者无实际价值。`types` 字段声明它仅满足 npm 包规范完整性。→ 可接受，后续若有库模式再充实导出
- **[低风险] `repository` 字段暂无实际地址**: 若仓库地址变动，需同步更新。→ 暂时填写占位地址或留空，发布前由维护者确认

## Open Questions

- ~~GitHub 仓库最终地址待确认~~ → 已确认并填入 `https://github.com/wloops/ai-advisor-kit.git`
