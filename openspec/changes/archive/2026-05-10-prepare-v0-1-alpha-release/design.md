## Context

当前仓库已经具备 v0.1 alpha 的核心实现基础：

- `package.json` 已声明 `name: ai-advisor-kit`、`version: 0.1.0`、`bin.advisor: ./dist/cli.js`、`files`、`build` 和 `test` 脚本。
- `tsup.config.ts` 会把 `src/cli.ts` 构建为带 shebang 的 ESM CLI，并输出类型文件、source map 和清理后的 `dist`。
- `src/cli.ts` 已注册 `init`、`start`、`ask`、`resume`、`review`、`doctor`、`sync`。
- `templates.ts` 和 `skills.ts` 依赖包根目录中的 `templates/` 与 `skills/`，因此 npm 包必须包含这两个目录。
- `README.md` 已包含 MVP 定位、安全说明和基本命令，但仍偏方案说明，需要补成外部用户可以直接照做的安装与试用文档。
- `tests/` 已覆盖主要命令、上下文安全和 `sync --skills` 行为，但发布前还缺少 npm 包内容、dry-run 发布和本地安装的手动验证记录。

本次 change 的核心约束是：只整理 alpha 发布所需的元数据、文档、示例和验证流程，不改变 CLI 主流程，也不扩大产品边界。

## Goals / Non-Goals

**Goals:**

- 让 npm 包元数据达到 v0.1 alpha dry-run 发布的最低可审查标准。
- 让 README 从“最终方案”转为“用户可执行的使用说明”，同时保留产品边界和安全约束。
- 提供 simple 模式与 OpenSpec 模式的 examples 或 smoke-test 文档，方便真实项目试用前自检。
- 建立发布前验证顺序，覆盖 build、test、pack、publish dry-run、本地 link 和临时项目试用。
- 明确 npm 包内容白名单和排除项，避免漏发 `templates/`、`skills/` 或误发敏感/临时文件。

**Non-Goals:**

- 不新增 lane 并行功能。
- 不新增 GUI。
- 不自动调用模型 API。
- 不改变 `advisor init/start/ask/resume/review/doctor/sync --skills` 的主流程设计。
- 不发布正式 1.0。
- 不把发布验证做成自动调用外部服务的流程。

## Decisions

### 1. package.json 采用最小 alpha 发布元数据

保留当前包名和版本：

```json
{
  "name": "ai-advisor-kit",
  "version": "0.1.0"
}
```

理由：v0.1 alpha 的目标是试用和反馈，不需要重新命名或升级到稳定版本。`bin.advisor` 必须继续指向 `./dist/cli.js`，因为 `npm link`、`npm pack` 安装和用户全局运行都依赖这个入口。

`files` 必须至少包含：

```text
dist
templates
skills
README.md
```

当前 `files` 还包含 `docs`，可以保留，前提是 docs 中不包含临时验证输出或敏感信息。`repository` 可以暂时不填或用 TODO 标记，但不能阻塞 alpha dry-run；正式公开发布前再补全仓库 URL。

### 2. README 按真实试用流程重组

README 应优先服务第一次安装和试用，而不是只描述架构。建议结构：

```text
1. ai-advisor-kit 是什么
2. 安装
3. 快速开始：simple 模式
4. 快速开始：OpenSpec 模式
5. 命令说明
6. Skills 安装目录
7. 安全与上下文收集
8. 发布/试用状态说明
```

命令说明应覆盖用户要求的全部入口：

```bash
advisor init
advisor start
advisor ask
advisor resume
advisor review
advisor doctor
advisor sync --skills
```

README 需要明确 `advisor ask` 默认不运行 build/test，只有显式传入 `--run build` 或 `--run test` 才执行项目脚本。这样能避免用户误以为工具会自动运行命令或调用模型。

### 3. examples 或 smoke-test 文档使用可复制流程

本次不需要引入示例应用。更低风险的做法是新增文档型 smoke test，例如：

```text
docs/SMOKE_TESTS.md
```

或按示例拆分：

```text
examples/simple-project.md
examples/openspec-project.md
```

文档必须包含可复制命令、预期生成文件和清理提示。临时项目建议位于系统临时目录或用户自选空目录，不应写入仓库中的测试临时目录。

simple 流程最小覆盖：

```bash
advisor init --mode simple
advisor start --title "验证 alpha 流程" --scope "src/**" --blocked-scope "不要修改 package metadata"
advisor ask
advisor review
advisor doctor
```

OpenSpec 流程最小覆盖：

```bash
advisor init --mode openspec
advisor start --change <change-name> --title "执行 <change-name>"
advisor ask
advisor review
advisor doctor
```

### 4. 发布验证分为构建验证、包内容验证和安装验证

发布前命令顺序固定为：

```bash
pnpm build
pnpm test
npm pack
npm publish --dry-run
```

原因是 `npm pack` 检查实际 tarball 内容，`npm publish --dry-run` 检查 npm 发布阶段元数据和文件选择；二者覆盖点不同，不能互相替代。

本地安装验证应在 pack/dry-run 后执行：

```bash
npm link
advisor --help
```

然后在临时 simple 和 OpenSpec 项目中运行最小流程。验证完成后如有全局 link，应在文档中提示使用 `npm unlink -g ai-advisor-kit` 或等价命令清理，但实现任务不应自动修改用户全局 npm 环境。

### 5. npm 包内容以白名单和负面清单双重检查

必须确认 tarball 中存在：

```text
package/dist/
package/templates/
package/skills/
package/README.md
```

必须确认 tarball 中不存在：

```text
package/node_modules/
package/.env
package/.env.*
package/tests/
package/openspec/changes/prepare-v0-1-alpha-release/
```

`tests/` 不在当前 `files` 白名单中，正常不应进入包。`openspec/` 也不在当前 `files` 白名单中，发布包不应包含正在开发中的 OpenSpec change。由于 npm pack 的实际输出受 `files`、`.npmignore` 和默认规则共同影响，任务中必须用 tarball 内容列表做一次人工或脚本化核对。

## Risks / Trade-offs

- [Risk] README 过度偏发布流程，弱化产品定位。  
  Mitigation: 保留简短定位和边界说明，把详细方案留在 `docs/FINAL_DESIGN.md`。

- [Risk] `files` 白名单漏掉 `templates/` 或 `skills/` 会导致安装后 CLI 在运行时找不到资源。  
  Mitigation: 在 npm pack 内容检查和 `npm link` 临时项目试用中同时验证。

- [Risk] `docs` 被打进 npm 包后可能包含仍在开发的内部设计文档。  
  Mitigation: alpha 阶段可以保留 docs，但必须检查其中没有临时日志、敏感内容或误导性的未实现承诺。

- [Risk] `npm publish --dry-run` 依赖 npm 账号/registry 环境，可能在离线或未登录环境下表现不同。  
  Mitigation: 记录命令输出和失败原因；若是环境问题，至少完成 `npm pack` 与本地 tarball 安装验证。

- [Risk] `npm link` 会修改用户全局 npm link 状态。  
  Mitigation: 文档中明确这是手动验证步骤，并提供清理命令；实现任务不自动执行全局清理。

## Migration Plan

本次是 alpha 发布准备，不涉及数据迁移或运行时破坏性变更。

实施顺序：

1. 检查并调整 `package.json`。
2. 更新 README。
3. 新增 examples 或 smoke-test 文档。
4. 运行 build/test/pack/dry-run。
5. 执行 `npm link` 和临时项目试用。
6. 根据验证结果补充文档或修正包内容白名单。

回滚策略：如果发布验证失败，回滚本次文档和包元数据改动即可；不需要迁移用户项目。

## Open Questions

- `repository` 字段在 v0.1 alpha 前是否补正式 URL，还是先使用 TODO？
- examples 使用单个 `docs/SMOKE_TESTS.md`，还是拆成 `examples/simple-project.md` 与 `examples/openspec-project.md`？
- `docs` 是否继续包含在 npm 包中，还是 v0.1 alpha 只发布 README、dist、templates 和 skills？
