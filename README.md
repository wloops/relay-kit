# ai-advisor-kit 最终方案

`ai-advisor-kit` 是一个 **Skills-first、CLI-assisted** 的 AI 编程工作流工具包。

它不是自动写代码工具，也不是完整多 Agent 框架。它的目标是把 **Advisor Strategy** 固化成一套可复用流程：

```text
小模型 / Executor 负责执行
聪明模型 / Advisor 负责规划、指点、Review
人类 Owner 负责方向、验收、最终提交
```

## 核心定位

```text
OpenSpec 管“做什么”
advisor-kit 管“怎么交给小模型、卡住怎么求助、完成怎么 Review”
OpenCode / Claude Code / Codex 等工具负责实际执行
```

## MVP 命令

```bash
advisor init
advisor start
advisor ask
advisor resume
advisor review
advisor doctor
advisor sync --skills
```

### 安装与本地运行

```bash
pnpm install
pnpm build
pnpm dev -- --help
```

打包后 CLI 入口是：

```bash
advisor --help
```

### 最小使用流程

在目标项目中初始化 advisor-kit：

```bash
advisor init
advisor init --mode simple
advisor init --mode openspec
advisor init --with-openspec
```

`advisor init` 会写入项目级配置和 Skills：

```text
.advisor-kit/config.json
.advisor-kit/state.json
.advisor-kit/skills
.claude/skills
.agents/skills
docs/agent-handoffs/runs
AGENTS.md
```

默认不会写入用户级目录：

```text
~/.claude/skills
~/.agents/skills
```

后续更新 `.advisor-kit/skills` 后，可以同步到具体工具目录：

```bash
advisor sync --skills
advisor sync --skills --target claude
advisor sync --skills --target codex
advisor sync --skills --target all --scope project
advisor sync --skills --target all --scope user
advisor sync --skills --dry-run
advisor sync --skills --force
```

默认只同步到当前项目配置启用的项目级目录，不会写入用户级 Skills。Codex 目录使用 `.agents/skills`，不会使用 `.codex/skills`。如果目标 Skill 疑似被用户修改，sync 会跳过并报告冲突；确认要覆盖时再使用 `--force`。

simple 模式任务流：

```bash
advisor start --title "实现登录错误提示" --scope "src/**" --blocked-scope "不要修改数据库 schema"
advisor ask
advisor ask --run build
advisor ask --run test
advisor resume
advisor review
advisor doctor
```

OpenSpec 模式任务流：

```bash
advisor init --mode openspec
advisor start --change add-example-feature --title "执行 add-example-feature"
advisor ask
advisor review
```

`advisor start` 只生成 `EXECUTOR_TASK.md`。`advisor ask` 默认只收集现有上下文；只有显式传入 `--run build` 或 `--run test` 时才执行项目脚本，并把命令、退出码和截断日志写入 `ASK_ADVISOR.md`。

MVP 不会自动调用模型 API、不会自动执行 OpenCode / Claude Code / Codex、不会自动提交 git，也不会替代 `/opsx:apply`。

## MVP Skills

```text
advisor-planner
advisor-delegator
advisor-escalation
advisor-reviewer
```

后续增强：

```text
advisor-lane-planner
advisor-docs
```

## 日常使用心智模型

```text
规划任务 → 委派小模型 → 小模型执行 → 卡住求助 → 顾问指点 → 继续执行 → 完成 Review
```

自然语言使用方式：

```text
用 advisor-planner 帮我规划这个功能。
用 advisor-delegator 把当前 change 的第 1-2 项交给 OpenCode。
OpenCode 卡住了，用 advisor-escalation 分析 ASK_ADVISOR。
用 advisor-reviewer review 当前实现。
```

## Skills 安装策略

`advisor init` 默认安装项目级 Skills，不默认安装用户级 Skills。

默认目标：

```text
.advisor-kit/skills   advisor-kit 管理副本，必选
.claude/skills        Claude Code 项目级 Skills
.agents/skills        Codex 项目级 Skills
```

用户级作为高级选项：

```text
~/.claude/skills
~/.agents/skills
```

详细规则见：

```text
docs/SKILLS_INSTALLATION.md
```
