# v0.1 alpha 冒烟测试

本文档用于在发布前或本地安装后验证 `ai-advisor-kit` 的最小真实项目流程。所有临时项目都应创建在仓库外，避免把 smoke-test 产物提交进发布包。

## 前置准备

在 `ai-advisor-kit` 仓库中构建并链接 CLI：

```bash
pnpm install
pnpm build
npm link
advisor --help
```

试用完成后清理全局 link：

```bash
npm unlink -g ai-advisor-kit
```

也可以使用 tarball 试用：

```bash
pnpm build
npm pack
npm install -g ./ai-advisor-kit-0.1.0.tgz
advisor --help
```

## simple 项目流程

创建仓库外临时项目：

```bash
mkdir advisor-smoke-simple
cd advisor-smoke-simple
npm init -y
mkdir src
echo "console.log('hello advisor')" > src/index.js
```

运行 advisor 流程：

```bash
advisor init --mode simple
advisor start --title "验证 alpha simple 流程" --scope "src/**" --blocked-scope "不要修改 package metadata"
advisor ask
advisor review
advisor doctor
```

预期生成：

```text
.advisor-kit/config.json
.advisor-kit/state.json
.advisor-kit/skills/advisor-planner/SKILL.md
.claude/skills/advisor-delegator/SKILL.md
.agents/skills/advisor-reviewer/SKILL.md
docs/agent-handoffs/runs/<run-id>/lanes/main/EXECUTOR_TASK.md
docs/agent-handoffs/runs/<run-id>/lanes/main/ASK_ADVISOR.md
docs/agent-handoffs/runs/<run-id>/lanes/main/REVIEW_REQUEST.md
AGENTS.md
```

常见失败：

- `advisor ask` 提示没有 current run：先运行 `advisor start`。
- `advisor init` 提示已初始化：确认是否要使用 `advisor init --force` 重写 advisor-kit 管理文件。
- `advisor ask --run build` 提示没有 build 命令：先在目标项目 `package.json` 中添加 `scripts.build`。

## OpenSpec 项目流程

创建仓库外临时项目和最小 OpenSpec change：

```bash
mkdir advisor-smoke-openspec
cd advisor-smoke-openspec
npm init -y
mkdir -p openspec/changes/add-demo
echo "## Why\n\n验证 OpenSpec handoff。" > openspec/changes/add-demo/proposal.md
echo "## Context\n\n最小设计。" > openspec/changes/add-demo/design.md
echo "- [ ] 1.1 验证 advisor start 可以读取 change。" > openspec/changes/add-demo/tasks.md
```

运行 advisor 流程：

```bash
advisor init --mode openspec
advisor start --change add-demo --title "执行 add-demo"
advisor ask
advisor review
advisor doctor
```

预期生成：

```text
.advisor-kit/config.json
.advisor-kit/state.json
docs/agent-handoffs/runs/<run-id>/lanes/main/EXECUTOR_TASK.md
docs/agent-handoffs/runs/<run-id>/lanes/main/ASK_ADVISOR.md
docs/agent-handoffs/runs/<run-id>/lanes/main/REVIEW_REQUEST.md
```

`EXECUTOR_TASK.md` 应包含 `OpenSpec Change: add-demo`，并包含 `proposal.md`、`design.md`、`tasks.md` 的上下文摘要。advisor-kit 只生成 handoff，不替代 `/opsx:apply`。

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
