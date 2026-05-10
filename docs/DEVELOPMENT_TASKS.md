# 开发任务拆解

## Phase 1：项目骨架

- [ ] 创建 npm 包
- [ ] TypeScript 配置
- [ ] tsup 打包
- [ ] commander/cac CLI
- [ ] package.json bin: advisor
- [ ] advisor --help
- [ ] 命令占位：init/start/ask/resume/review/doctor

## Phase 2：init

- [ ] 检测 git
- [ ] 检测 package.json
- [ ] 检测包管理器
- [ ] 检测 OpenSpec
- [ ] 交互选择 simple/openspec/with-openspec
- [ ] 创建 .advisor-kit/config.json 和 state.json
- [ ] 创建 docs/agent-handoffs/runs
- [ ] 注入 AGENTS.md
- [ ] 导出 skills 到 .advisor-kit/skills
- [ ] 交互选择是否同步到 .claude/skills
- [ ] 交互选择是否同步到 .agents/skills
- [ ] 不默认安装用户级 skills

## Phase 3：run/lane 基础

- [ ] 生成 runId
- [ ] 创建 lanes/main
- [ ] 读取 current run/lane
- [ ] state.json 记录 currentRun/currentLane

## Phase 4：start

- [ ] simple 模式输入 title/scope
- [ ] OpenSpec 模式支持选择 change/tasks
- [ ] 渲染 EXECUTOR_TASK.md
- [ ] 支持 --copy
- [ ] 支持 --lane

## Phase 5：ask/resume/review/doctor

- [ ] ask 收集上下文并生成 ASK_ADVISOR.md
- [ ] resume 读取 ADVISOR_DECISION.md 并生成 RESUME_PROMPT.md
- [ ] review 生成 REVIEW_REQUEST.md
- [ ] doctor 检查项目接入状态


## Phase 10：skills sync

- [ ] 实现 `advisor sync --skills`
- [ ] 支持 `--target claude`
- [ ] 支持 `--target codex`
- [ ] 支持 `--target all`
- [ ] 支持 `--scope project`
- [ ] 支持 `--scope user`
- [ ] 从 `.advisor-kit/skills` 同步到目标目录
- [ ] 避免覆盖用户手动修改，覆盖前确认或备份
