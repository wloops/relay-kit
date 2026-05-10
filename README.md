# ai-advisor-kit

`ai-advisor-kit` 是一个 **Skills-first、CLI-assisted** 的 AI 编程工作流工具包。它把 Advisor Strategy 固化为可复用流程：小模型 / Executor 负责执行，聪明模型 / Advisor 负责规划、指点和 Review，人类 Owner 负责方向、验收和最终提交。

它不是自动写代码工具，也不是多 Agent 框架。它只负责初始化规则、安装项目级 Skills、生成 handoff 文件、收集受限上下文，并帮助你在真实项目里把任务交给 OpenCode、Claude Code、Codex 或其他执行工具。

```text
OpenSpec 管“做什么”
advisor-kit 管“怎么交给小模型、卡住怎么求助、完成怎么 Review”
OpenCode / Claude Code / Codex 等工具负责实际执行
```

## 安装

从 npm 安装：

```bash
npm install -g ai-advisor-kit
advisor --help
```

从当前仓库本地试用：

```bash
pnpm install
pnpm build
npm link
advisor --help
```

使用打包产物试用：

```bash
pnpm build
npm pack
npm install -g ./ai-advisor-kit-0.1.0.tgz
advisor --help
```

本地 `npm link` 会写入全局 npm link 状态。试用结束后可以清理：

```bash
npm unlink -g ai-advisor-kit
```

## 快速开始：simple 模式

适合没有 OpenSpec 的项目。

```bash
cd your-project
advisor init --mode simple
advisor start --title "实现登录错误提示" --scope "src/**" --blocked-scope "不要修改数据库 schema"
advisor ask
advisor review
advisor doctor
```

执行后会生成项目级配置、Skills 和 handoff 文件：

```text
.advisor-kit/config.json
.advisor-kit/state.json
.advisor-kit/skills/
.claude/skills/
.agents/skills/
docs/agent-handoffs/runs/<run-id>/lanes/main/EXECUTOR_TASK.md
docs/agent-handoffs/runs/<run-id>/lanes/main/ASK_ADVISOR.md
docs/agent-handoffs/runs/<run-id>/lanes/main/REVIEW_REQUEST.md
AGENTS.md
```

如果 Advisor 已经把决策写入 `ADVISOR_DECISION.md`，可以继续生成给 Executor 的恢复提示：

```bash
advisor resume
```

## 快速开始：OpenSpec 模式

适合已经有 `openspec/` 的项目。advisor-kit 会读取 change 文档并生成交接材料，但不会替代 `/opsx:apply`，也不会自动执行 OpenSpec change。

```bash
cd your-openspec-project
advisor init --mode openspec
advisor start --change add-example-feature --title "执行 add-example-feature"
advisor ask
advisor review
advisor doctor
```

如果项目还没有 OpenSpec，可以只显示引导说明：

```bash
advisor init --with-openspec
```

这个命令不会静默创建 `openspec/`。

## 命令说明

### advisor init

初始化当前项目：

```bash
advisor init
advisor init --mode simple
advisor init --mode openspec
advisor init --with-openspec
advisor init --force
```

`init` 会写入 `.advisor-kit/config.json`、`.advisor-kit/state.json`、`.advisorignore`、`AGENTS.md` advisor 规则、项目级 Skills 和 `docs/agent-handoffs/runs/`。

### advisor start

开始一次 handoff run，生成 `EXECUTOR_TASK.md`：

```bash
advisor start --title "实现登录错误提示" --scope "src/**" --blocked-scope "不要修改数据库 schema"
advisor start --change add-example-feature --title "执行 add-example-feature"
advisor start --copy
```

`start` 只生成交接文件，不调用模型、不执行构建、不提交 git。

### advisor ask

Executor 卡住时生成 `ASK_ADVISOR.md`：

```bash
advisor ask
advisor ask --run build
advisor ask --run test
advisor ask --copy
```

默认只收集现有上下文。只有显式传入 `--run build` 或 `--run test` 时，才会执行项目配置中的 build/test 命令，并把命令、退出码和截断日志写入求助包。

### advisor resume

读取 Advisor 决策并生成 `RESUME_PROMPT.md`：

```bash
advisor resume
advisor resume --from ./ADVISOR_DECISION.md
advisor resume --copy
```

默认从当前 run/lane 的 `ADVISOR_DECISION.md` 读取决策。

### advisor review

完成实现后生成 `REVIEW_REQUEST.md`：

```bash
advisor review
advisor review --copy
```

`review` 会收集当前任务、OpenSpec 上下文和受限 git diff，交给 Advisor 做审查。

### advisor doctor

检查当前项目接入状态：

```bash
advisor doctor
```

它会检查配置、状态、`AGENTS.md` 注入块、Skills 目录、handoff 目录、OpenSpec 状态和 package scripts。

### advisor sync --skills

把 `.advisor-kit/skills` 中的 advisor Skills 同步到工具目录：

```bash
advisor sync --skills
advisor sync --skills --target claude
advisor sync --skills --target codex
advisor sync --skills --target all --scope project
advisor sync --skills --target all --scope user
advisor sync --skills --dry-run
advisor sync --skills --force
```

默认只同步到当前项目配置启用的项目级目录，不会写入用户级 Skills。发生冲突时默认跳过并报告；确认要覆盖时再使用 `--force`。

## Skills 安装目录

`advisor init` 默认安装项目级 Skills：

```text
.advisor-kit/skills   advisor-kit 管理副本，必选
.claude/skills        Claude Code 项目级 Skills
.agents/skills        Codex 项目级 Skills
```

用户级目录只在显式同步时使用：

```text
~/.claude/skills
~/.agents/skills
```

Codex 项目级目录使用 `.agents/skills`，不会使用 `.codex/skills`。详细规则见 `docs/SKILLS_INSTALLATION.md`。

## 上下文安全

`advisor init` 会生成默认 `.advisorignore`。`advisor ask` 和 `advisor review` 收集上下文时会同时应用默认忽略规则、`.advisorignore` 和基础脱敏规则，避免把环境变量、密钥文件、日志、构建产物或无关大目录写入 handoff 文档。

默认忽略：

```text
.env
.env.*
node_modules/
dist/
build/
coverage/
.git/
*.pem
*.key
*.crt
*.p12
*.log
```

基础脱敏会处理常见 API key、token、secret、password、bearer token 和 private key block。它是防止常见泄露的保护层，不是完整安全扫描器。

MVP 不会自动调用模型 API、不会自动执行 OpenCode / Claude Code / Codex、不会自动提交 git，也不会替代 `/opsx:apply`。

## v0.1 alpha 状态

v0.1 alpha 面向本地安装和真实项目试用。发布前检查流程见 `docs/SMOKE_TESTS.md` 和 `docs/V0_1_ALPHA_RELEASE.md`。
