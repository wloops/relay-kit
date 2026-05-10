# v0.1 alpha 发布准备记录

本文档记录 `prepare-v0-1-alpha-release` 的发布前检查结论。它不是正式 release note；正式公开发布前仍应根据实际仓库地址、npm registry 状态和最终验证结果更新。

## package.json 结论

- `name`: `relay-kit`，符合包名和 CLI 定位。
- `version`: `0.1.0`，符合 alpha 试用阶段。
- `description`: `Skills-first, CLI-assisted AI programming relay workflow toolkit.`，准确描述工具定位。
- `bin.relay`: `dist/cli.js`，符合 npm bin 入口和构建产物路径。
- `files`: 包含 `dist`、`skills`、`templates`、`README.md`，以及精选的 `docs/` 文件（CLI_SPEC、FINAL_DESIGN、OPENSPEC_INTEGRATION、RUN_LANE_DESIGN、SKILLS_INSTALLATION、SMOKE_TESTS、USAGE_FLOW、V0_1_ALPHA_RELEASE）。排除了开发期内部文档（ROADMAP、DEVELOPMENT_TASKS、IMPLEMENTATION_PROMPTS、PACKAGE_STRUCTURE）。
- `scripts`: 包含 `build` 和 `test`，满足发布前本地验证。
- `license`: `MIT`。
- `repository`: v0.1 alpha 暂时留空；正式公开发布前再补充真实仓库 URL。

## 发布包内容策略

必须发布：

```text
dist
templates
skills
README.md
docs
```

其中 `docs` 暂时保留，因为 alpha 用户需要查看设计、Skills 安装和冒烟测试说明。

不得发布：

```text
node_modules
tests
.env
.env.*
openspec/changes
```

## 验证结果

已完成验证：

- `pnpm build`: 通过，`dist/cli.js` 重新生成，首行保留 `#!/usr/bin/env node`。
- `pnpm test`: 通过，27 个 node:test 子测试全部通过。
- `npm pack`: 通过，生成 `relay-kit-0.1.0.tgz`，tarball 共 32 个文件。
- tarball 必要内容检查：包含 `package/dist`、`package/templates`、`package/skills`、`package/README.md`。
- tarball 排除内容检查：未包含 `node_modules`、`tests`、`.env`、`.env.*`、`openspec/changes`。
- `npm publish --dry-run`: 通过；当前 registry 为 `https://registry.npmmirror.com`，npm 提示 dry-run 发布需要登录，但退出码为 0，未发现包内容错误。
- `npm link`: 通过。
- `relay --help`: 通过，能展示 `init`、`start`、`ask`、`resume`、`review`、`doctor`、`sync` 命令。
- simple 临时项目流程：通过，验证了 `relay init --mode simple`、`relay start`、`relay ask`、`relay review`、`relay doctor`，并确认生成项目级 Skills 与 handoff 文件。
- OpenSpec 临时项目流程：通过，验证了 `relay init --mode openspec`、`relay start --change add-demo`、`relay ask`、`relay review`、`relay doctor`，并确认 `EXECUTOR_TASK.md` 包含 `OpenSpec Change: add-demo`。

验证后已清理临时项目、全局 npm link 和本地 tarball。

## 边界确认

本次发布准备不新增 lane 并行功能，不新增 GUI，不自动调用模型 API，不改变 `relay init/start/ask/resume/review/doctor/sync --skills` 主流程设计，也不发布正式 1.0。
