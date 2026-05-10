## 1. CLI 范围与共享基础

- [x] 1.1 确认 CLI 只暴露 `init`、`start`、`ask`、`resume`、`review`、`doctor`，不注册 `sync`、`clean`、`lane`、`docs` 命令。
- [x] 1.2 新增配置、路径、模板渲染、安全写入、项目检测、OpenSpec 检测、git 上下文收集等共享模块。
- [x] 1.3 统一实现排除规则，确保 `.env`、`.env.*`、`node_modules`、`dist`、`build`、`coverage` 不进入扫描、上下文和 handoff 输出。
- [x] 1.4 为共享模块补充单元测试，覆盖路径限制、排除规则、模板缺失和安全写入行为。

## 2. advisor init

- [x] 2.1 实现项目检测：git、`package.json`、包管理器、package scripts、OpenSpec 基础结构。
- [x] 2.2 实现 simple/OpenSpec 模式选择，支持无 OpenSpec 项目的 simple 模式。
- [x] 2.3 实现 `--with-openspec` 引导逻辑，只提示和确认，不静默安装 OpenSpec，也不静默创建 `openspec/`。
- [x] 2.4 生成 `.advisor-kit/config.json`，保留项目级 Skills 默认启用、用户级 Skills 默认关闭的配置。
- [x] 2.5 生成最小 `.advisor-kit/state.json`，schema 固定为 `currentRun`、`currentLane`、`mode`、`currentChange`、`updatedAt`。
- [x] 2.6 创建 `docs/agent-handoffs/runs` 目录。
- [x] 2.7 使用 advisor-kit 标记块向 `AGENTS.md` 注入 Executor 规则，并保证重复执行不会重复注入。
- [x] 2.8 默认导出 `advisor-planner`、`advisor-delegator`、`advisor-escalation`、`advisor-reviewer` 到 `.advisor-kit/skills`、`.claude/skills`、`.agents/skills`。
- [x] 2.9 确保默认不写入 `~/.claude/skills` 和 `~/.agents/skills`。
- [x] 2.10 为 init 行为补充测试，覆盖首次初始化、重复初始化、`--force`、simple 模式、已有 OpenSpec、`--with-openspec`。

## 3. run/lane 基础

- [x] 3.1 实现 runId 生成规则，使用日期加可读 slug。
- [x] 3.2 创建 run 目录、`RUN.md`、`TASK_BOARD.md` 和 `lanes/main/`。
- [x] 3.3 更新 `.advisor-kit/state.json` 的 `currentRun`、`currentLane`、`mode`、`currentChange`、`updatedAt`。
- [x] 3.4 保留 lane 目录结构但不实现 `advisor lane` 命令，也不自动创建多 lane。
- [x] 3.5 为 run/lane 状态读写和目录创建补充测试。

## 4. advisor start

- [x] 4.1 simple 模式下支持通过参数或交互输入任务标题、允许范围和禁止范围。
- [x] 4.2 OpenSpec 模式下支持选择或指定当前 change，并读取 `proposal.md`、`design.md`、`tasks.md` 作为 handoff 来源。
- [x] 4.3 渲染 `EXECUTOR_TASK.md` 到当前 run 的 `lanes/main/`。
- [x] 4.4 支持 `--copy` 将生成内容复制到剪贴板；复制失败时不影响文件生成。
- [x] 4.5 确保 start 只生成交接说明，不执行模型 API、OpenCode、build、test 或 git commit。
- [x] 4.6 为 start 补充测试，覆盖 simple/OpenSpec 两种模式、模板渲染、缺失 change、复制失败。

## 5. advisor ask

- [x] 5.1 收集当前 `EXECUTOR_TASK.md`、git status、git diff stat、必要 diff 摘要和 OpenSpec 上下文。
- [x] 5.2 默认不执行 build 或 test。
- [x] 5.3 仅在显式传入 `--run build` 时执行构建命令，并把命令、退出码和截断日志写入 `ASK_ADVISOR.md`。
- [x] 5.4 仅在显式传入 `--run test` 时执行测试命令，并把命令、退出码和截断日志写入 `ASK_ADVISOR.md`。
- [x] 5.5 渲染 `ASK_ADVISOR.md` 到当前 run 的 `lanes/main/`。
- [x] 5.6 为 ask 补充测试，覆盖默认不运行命令、显式 build/test、日志截断、排除敏感路径。

## 6. advisor resume

- [x] 6.1 读取当前 lane 的 `ADVISOR_DECISION.md`，或支持从显式输入来源读取 Advisor 决策。
- [x] 6.2 从决策中提取给 Executor 的继续执行提示。
- [x] 6.3 渲染 `RESUME_PROMPT.md` 到当前 run 的 `lanes/main/`。
- [x] 6.4 为 resume 补充测试，覆盖缺失决策文件、空提示、正常渲染。

## 7. advisor review

- [x] 7.1 收集当前 run/lane、任务上下文、git diff stat 和必要 diff 内容。
- [x] 7.2 渲染 `REVIEW_REQUEST.md` 到当前 run 的 `lanes/main/`。
- [x] 7.3 确保 review 只生成 review 请求，不调用模型 API，不自动提交 git。
- [x] 7.4 为 review 补充测试，覆盖无 diff、有 diff、diff 截断和 OpenSpec 模式上下文。

## 8. advisor doctor

- [x] 8.1 检查 `.advisor-kit/config.json`、`.advisor-kit/state.json`、`AGENTS.md` 注入块、Skills 目录和 handoff 目录。
- [x] 8.2 检查 OpenSpec 状态、package scripts、当前 run/lane、未处理的 `ASK_ADVISOR.md` 与 `ADVISOR_DECISION.md`。
- [x] 8.3 输出可读的状态报告和修复建议，但不自动修改项目文件。
- [x] 8.4 为 doctor 补充测试，覆盖健康项目、缺失配置、缺失 Skills、OpenSpec 缺失和未处理 handoff。

## 9. 验证与文档

- [x] 9.1 运行类型检查和构建，确保 CLI 包可打包。
- [x] 9.2 运行测试，覆盖 MVP 命令和共享模块。
- [x] 9.3 更新 README 的 MVP 使用说明，确保不宣传非 MVP 命令。
- [x] 9.4 检查生成文件不会包含 `.env`、`.env.*`、`node_modules`、`dist`、`build`、`coverage` 内容。
- [x] 9.5 手动验证一个 simple 模式项目的 `init → start → ask → resume → review → doctor` 流程。
- [x] 9.6 手动验证一个已有 OpenSpec 项目的 `init → start → ask → review` 流程，并确认 advisor-kit 不替代 `/opsx:apply`。
