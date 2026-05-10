## Why

`ai-advisor-kit` 已经有产品方案、CLI 规格、模板和 Skills 草案，但当前实现仍停留在命令占位阶段。需要创建第一个 OpenSpec change，把 MVP 的命令边界、文件生成规则和集成策略固化下来，作为后续实现与 review 的依据。

这次变更优先解决“如何把 Advisor Strategy 落到可复用 CLI 工作流”的问题：初始化项目规则，生成交接文件，收集求助上下文，并为完成后的 review 提供稳定入口。

## What Changes

- 实现 MVP CLI 命令范围的设计与任务拆分：
  - `advisor init`
  - `advisor start`
  - `advisor ask`
  - `advisor resume`
  - `advisor review`
  - `advisor doctor`
- 明确 `advisor init` 的项目级 Skills 默认安装策略：
  - `.advisor-kit/skills`
  - `.claude/skills`
  - `.agents/skills`
- 明确不默认安装用户级 Skills：
  - `~/.claude/skills`
  - `~/.agents/skills`
- 明确 simple/OpenSpec 两种接入模式：
  - 没有 OpenSpec 的目标项目可以使用 simple 模式。
  - `advisor init --with-openspec` 只能引导初始化，不能静默安装 OpenSpec，也不能静默创建 `openspec/`。
- 明确 `advisor ask` 默认只收集现有上下文，不执行 `build` 或 `test`；只有显式传入 `--run build` 或 `--run test` 时才执行对应命令。
- 明确敏感文件和大目录必须从上下文收集、diff 摘要和文件扫描中排除：
  - `.env`
  - `.env.*`
  - `node_modules`
  - `dist`
  - `build`
  - `coverage`
- 明确 MVP 不包含：
  - `advisor sync`
  - `advisor clean`
  - `advisor lane`
  - `advisor docs`
  - 自动调用模型 API
  - 自动执行 OpenCode
  - 自动提交 git
  - GUI

## Capabilities

### New Capabilities

- `mvp-advisor-cli`: 定义 ai-advisor-kit MVP CLI 的命令行为、Skills 安装策略、run/lane 文件结构、OpenSpec 集成边界和文件生成规则。

### Modified Capabilities

- 无。当前 `openspec/specs/` 下没有已发布 capability，本次是第一个 change。

## Impact

- 影响未来实现范围：
  - `src/cli.ts`
  - `src/commands/init.ts`
  - `src/commands/start.ts`
  - `src/commands/ask.ts`
  - `src/commands/resume.ts`
  - `src/commands/review.ts`
  - `src/commands/doctor.ts`
  - 后续新增的 `src/core/**` 与 `src/types/**`
- 影响生成文件与模板：
  - `templates/AGENTS.advisor.md`
  - `templates/config.template.json`
  - `templates/EXECUTOR_TASK.template.md`
  - `templates/ASK_ADVISOR.template.md`
  - `templates/ADVISOR_DECISION.template.md`
  - `templates/RESUME_PROMPT.template.md`
  - `templates/REVIEW_REQUEST.template.md`
  - `templates/REVIEW_REPORT.template.md`
  - `templates/TASK_BOARD.template.md`
- 影响 Skills 导出范围：
  - `skills/advisor-planner`
  - `skills/advisor-delegator`
  - `skills/advisor-escalation`
  - `skills/advisor-reviewer`
- 不新增模型 API、OpenCode、Git 自动化或 GUI 依赖。
