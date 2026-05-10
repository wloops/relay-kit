## 1. 发布元数据检查

- [x] 1.1 检查 `package.json` 的 `name`、`version`、`description`、`license`、`engines` 与 `packageManager`，确认符合 v0.1 alpha 发布定位。
- [x] 1.2 检查 `bin.advisor` 是否指向构建后的 CLI 入口，并确认 `pnpm build` 后 `dist/cli.js` 可作为 npm bin 运行。
- [x] 1.3 检查 `files` 白名单，确认至少包含 `dist`、`templates`、`skills`、`README.md`，并评估是否继续发布 `docs`。
- [x] 1.4 检查 `scripts` 是否覆盖发布前需要的 `build` 与 `test`，必要时补充不改变主流程的验证脚本。
- [x] 1.5 决定 `repository` 字段在 alpha 阶段是补正式 URL、留空，还是使用 TODO 注释方案。

## 2. README 使用说明

- [x] 2.1 重组 README 开头，使用户先看到产品定位、安装方式和最小试用路径。
- [x] 2.2 补充安装说明，覆盖本地开发安装、npm 包安装和 `npm link` 试用场景。
- [x] 2.3 补充 `advisor init`、`advisor start`、`advisor ask`、`advisor resume`、`advisor review`、`advisor doctor`、`advisor sync --skills` 的实际用法。
- [x] 2.4 补充 simple 模式完整示例，覆盖初始化、开始任务、求助、继续、review 和 doctor。
- [x] 2.5 补充 OpenSpec 模式完整示例，说明 advisor-kit 只读取和交接 change，不替代 `/opsx:apply`。
- [x] 2.6 补充 Skills 安装目录说明，明确 `.advisor-kit/skills`、`.claude/skills`、`.agents/skills` 与用户级目录的区别。
- [x] 2.7 补充安全说明，明确 `.advisorignore`、默认忽略项、基础脱敏能力，以及不会自动调用模型 API。

## 3. 示例与冒烟测试文档

- [x] 3.1 选择文档位置：单个 `docs/SMOKE_TESTS.md`，或拆分为 `examples/simple-project.md` 与 `examples/openspec-project.md`。
- [x] 3.2 编写 simple 项目冒烟流程，包含可复制命令、预期生成文件和常见失败处理。
- [x] 3.3 编写 OpenSpec 项目冒烟流程，包含最小 change 结构、`advisor init --mode openspec`、`advisor start --change` 和 review 流程。
- [x] 3.4 在示例文档中明确临时项目应创建在仓库外，避免把 smoke-test 产物提交进发布包。
- [x] 3.5 在示例文档中补充 `npm link` 清理提示，避免用户长期保留不需要的全局链接。

## 4. 发布包内容验证

- [x] 4.1 运行 `pnpm build`，确认 `dist` 重新生成且 CLI shebang 保留。
- [x] 4.2 运行 `pnpm test`，确认现有命令、上下文安全和 Skills 同步测试通过。
- [x] 4.3 运行 `npm pack`，记录生成的 tarball 名称和 npm 输出的文件清单。
- [x] 4.4 检查 tarball 必须包含 `package/dist`、`package/templates`、`package/skills`、`package/README.md`。
- [x] 4.5 检查 tarball 不包含 `node_modules`、测试临时目录、`.env`、`.env.*`、`openspec/changes/prepare-v0-1-alpha-release`。
- [x] 4.6 如 `docs` 被包含在 tarball 中，检查其中没有临时日志、敏感信息或明显未实现承诺。

## 5. npm dry-run 与本地安装验证

- [x] 5.1 运行 `npm publish --dry-run`，记录成功输出；如因 registry 或登录环境失败，记录失败原因并确认不是包内容问题。
- [x] 5.2 运行 `npm link`，确认全局 `advisor --help` 可以展示 CLI 帮助。
- [x] 5.3 在仓库外创建临时 simple 项目，运行 `advisor init --mode simple`、`advisor start`、`advisor ask`、`advisor review`、`advisor doctor`。
- [x] 5.4 在仓库外创建临时 OpenSpec 项目，运行 `advisor init --mode openspec`、`advisor start --change <change>`、`advisor ask`、`advisor review`、`advisor doctor`。
- [x] 5.5 验证临时项目中生成的 `.advisor-kit/skills`、`.claude/skills`、`.agents/skills` 与 handoff 文件路径符合 README 说明。
- [x] 5.6 验证完成后清理临时项目和全局 npm link，避免本地环境污染后续测试。

## 6. 发布前收尾

- [x] 6.1 根据验证结果修正 README、examples 或 package 元数据中的不准确描述。
- [x] 6.2 确认本次 change 未新增 lane 并行、GUI、模型 API 调用或主流程设计变更。
- [x] 6.3 确认 git diff 只包含发布准备相关改动，避免把无关文件或验证产物混入同一提交。
- [x] 6.4 汇总发布前验证结果，形成 v0.1 alpha 试用状态说明。
