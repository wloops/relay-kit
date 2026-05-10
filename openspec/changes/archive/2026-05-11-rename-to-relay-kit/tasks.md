## 1. 包与 CLI 重命名

- [x] 1.1 修改 `package.json`：`name` → `relay-kit`，`bin` → `{ "relay": "./dist/cli.js" }`，`repository` → relay-kit 仓库
- [x] 1.2 修改 `src/cli.ts`：程序名 `advisor` → `relay`，描述更新
- [x] 1.3 修改 `src/core/constants.ts`：`CONFIG_FILE`、`STATE_FILE` 路径从 `.advisor-kit/` 改为 `.relay/`，`DEFAULT_IGNORE_FILE` 从 `.advisorignore` 改为 `.relayignore`，`DEFAULT_SKILLS` 列表从 `advisor-*` 改为 `relay-*`，`AGENTS_MARKER_START/END` 更新
- [x] 1.4 修改 `src/core/types.ts`：类型定义中的注释和默认值更新

## 2. 状态追踪扩展

- [x] 2.1 扩展 `src/core/types.ts`：`AdvisorState` 添加 `advisorMode`、`executorFailures`、`directFixLog` 字段
- [x] 2.2 修改 `src/core/state.ts`：`createDefaultState` 初始化新字段默认值，`updateState` 支持新字段写入
- [x] 2.3 修改 `src/core/config.ts`：目录常量引用确认更新

## 3. 源代码引用更新

- [x] 3.1 修改 `src/core/skills.ts`：skill 安装目标路径引用更新（`.relay/skills`）
- [x] 3.2 修改 `src/core/runs.ts`：handoff 目录路径引用确认（`docs/agent-handoffs` 不变，但 `EXECUTOR_TASK.md` 等文件名引用的上下文文本更新）
- [x] 3.3 修改 `src/commands/init.ts`：创建的目录和文件路径更新，注入 AGENTS.md 的标记更新
- [x] 3.4 修改 `src/commands/start.ts`：输出文本和模板渲染参数的引用更新
- [x] 3.5 修改 `src/commands/ask.ts`：输出文本引用更新
- [x] 3.6 修改 `src/commands/resume.ts`：输出文本和角色声明更新
- [x] 3.7 修改 `src/commands/review.ts`：输出文本和角色声明更新
- [x] 3.8 修改 `src/commands/doctor.ts`：检查引用更新
- [x] 3.9 修改 `src/commands/sync.ts`：skill 目录引用更新
- [x] 3.10 修改 `src/core/context-safety.ts`：advisorignore → relayignore 引用更新

## 4. Skill 文件重命名与内容更新

- [x] 4.1 重命名 `skills/advisor-planner/` → `skills/relay-planner/`，更新 SKILL.md 内容（name、description、角色声明、命令引用）
- [x] 4.2 重命名 `skills/advisor-delegator/` → `skills/relay-delegator/`，更新 SKILL.md 为内部自动衔接模式（移除 `/advisor:delegate` 命令引用，声明由 planner 自动触发）
- [x] 4.3 重命名 `skills/advisor-escalation/` → `skills/relay-escalation/`，更新 SKILL.md 为内部自动衔接模式
- [x] 4.4 重命名 `skills/advisor-reviewer/` → `skills/relay-reviewer/`，更新 SKILL.md 加入 DIRECT_FIX 4 条件规则，添加 `/relay:review` 命令触发
- [x] 4.5 重命名 `skills/advisor-lane-planner/` → `skills/relay-lane-planner/`（预留，仅重命名）
- [x] 4.6 重命名 `skills/advisor-docs/` → `skills/relay-docs/`（预留，仅重命名）
- [x] 4.7 新增 `skills/relay-runner/SKILL.md`：Executor 角色 skill，自动检测 EXECUTOR_TASK.md vs RESUME_PROMPT.md，定义升级规则
- [x] 4.8 新增 `skills/relay-fixer/SKILL.md`：DIRECT_FIX 模式 skill，定义 4 条件入口和修改后行为约束

## 5. 模板更新

- [x] 5.1 更新 `templates/AGENTS.advisor.md`：产品名和注入标记更新，角色声明更新，添加角色模式说明
- [x] 5.2 更新 `templates/EXECUTOR_TASK.template.md`：产品名引用更新
- [x] 5.3 更新 `templates/ASK_ADVISOR.template.md`：产品名和角色声明更新
- [x] 5.4 更新 `templates/ADVISOR_DECISION.template.md`：产品名更新
- [x] 5.5 更新 `templates/RESUME_PROMPT.template.md`：产品名更新
- [x] 5.6 更新 `templates/REVIEW_REQUEST.template.md`：产品名更新
- [x] 5.7 更新 `templates/REVIEW_REPORT.template.md`：产品名更新，添加 DIRECT_FIX 相关输出字段
- [x] 5.8 更新 `templates/TASK_BOARD.template.md`：产品名更新
- [x] 5.9 更新 `templates/config.template.json`：默认配置值更新

## 6. 文档更新

- [x] 6.1 重命名 `docs/` 下所有文档的 `.advisor-kit` 引用为 `.relay`
- [x] 6.2 更新 `README.md`：产品名、安装命令、CLI 命令
- [x] 6.3 更新 `CHANGELOG.md`：新增 v0.2.0 版本条目，标注 BREAKING CHANGE
- [x] 6.4 更新 `docs/USAGE_FLOW.md`：命令流更新
- [x] 6.5 更新 `docs/FINAL_DESIGN.md`：产品命名和角色体系更新

## 7. 测试更新

- [x] 7.1 更新 `tests/` 下所有测试的 CLI 命令引用和断言文本
- [x] 7.2 新增 state-tracking 新字段的测试

## 8. 验证

- [x] 8.1 运行 `pnpm typecheck` 确认无类型错误
- [x] 8.2 运行 `pnpm build` 确认构建成功
- [x] 8.3 运行 `pnpm test` 确认测试通过
- [x] 8.4 运行 `relay init` 确认新项目初始化正确
- [x] 8.5 运行 `relay start` + `relay review` + `relay resume` + `relay ask` 确认全流程无异常
