# v0.1 alpha 冒烟测试

本文档用于在发布前或本地安装后验证 `relay-kit` 的最小真实项目流程。所有临时项目都应创建在仓库外，避免把 smoke-test 产物提交进发布包。

## 前置准备

在 `relay-kit` 仓库中构建并链接 CLI：

```bash
pnpm install
pnpm build
npm link
relay --help
```

试用完成后清理全局 link：

```bash
npm unlink -g relay-kit
```

也可以使用 tarball 试用：

```bash
pnpm build
npm pack
npm install -g ./relay-kit-0.1.0.tgz
relay --help
```

## simple 项目流程

创建仓库外临时项目：

```bash
mkdir relay-smoke-simple
cd relay-smoke-simple
npm init -y
mkdir src
echo "console.log('hello relay')" > src/index.js
```

运行 relay 流程：

```bash
relay init --mode simple
relay start --title "验证 alpha simple 流程" --scope "src/**" --blocked-scope "不要修改 package metadata"
relay ask
relay review
relay doctor
```

预期生成：

```text
.relay/config.json
.relay/state.json
.relay/skills/relay-planner/SKILL.md
.claude/skills/relay-delegator/SKILL.md
.agents/skills/relay-reviewer/SKILL.md
docs/agent-handoffs/runs/<run-id>/lanes/main/EXECUTOR_TASK.md
docs/agent-handoffs/runs/<run-id>/lanes/main/ASK_ADVISOR.md
docs/agent-handoffs/runs/<run-id>/lanes/main/REVIEW_REQUEST.md
AGENTS.md
```

常见失败：

- `relay ask` 提示没有 current run：先运行 `relay start`。
- `relay init` 提示已初始化：确认是否要使用 `relay init --force` 重写 relay-kit 管理文件。
- `relay ask --run build` 提示没有 build 命令：先在目标项目 `package.json` 中添加 `scripts.build`。

## OpenSpec 项目流程

创建仓库外临时项目和最小 OpenSpec change：

```bash
mkdir relay-smoke-openspec
cd relay-smoke-openspec
npm init -y
mkdir -p openspec/changes/add-demo
echo "## Why\n\n验证 OpenSpec handoff。" > openspec/changes/add-demo/proposal.md
echo "## Context\n\n最小设计。" > openspec/changes/add-demo/design.md
echo "- [ ] 1.1 验证 relay start 可以读取 change。" > openspec/changes/add-demo/tasks.md
```

运行 relay 流程：

```bash
relay init --mode openspec
relay start --change add-demo --title "执行 add-demo"
relay ask
relay review
relay doctor
```

预期生成：

```text
.relay/config.json
.relay/state.json
docs/agent-handoffs/runs/<run-id>/lanes/main/EXECUTOR_TASK.md
docs/agent-handoffs/runs/<run-id>/lanes/main/ASK_ADVISOR.md
docs/agent-handoffs/runs/<run-id>/lanes/main/REVIEW_REQUEST.md
```

`EXECUTOR_TASK.md` 应包含 `OpenSpec Change: add-demo`，并包含 `proposal.md`、`design.md`、`tasks.md` 的上下文摘要。relay-kit 只生成 handoff，不替代 `/opsx:apply`。

## 发布包验证

发布前按顺序运行：

```bash
pnpm build
pnpm test
npm pack
npm publish --dry-run
```

检查 tarball 必须包含：

```text
package/dist/
package/templates/
package/skills/
package/README.md
```

检查 tarball 不应包含：

```text
package/node_modules/
package/tests/
package/.env
package/.env.*
package/openspec/changes/
```
