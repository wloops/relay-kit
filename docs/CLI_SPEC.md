# CLI 规格

## 1. MVP 命令

```bash
advisor init
advisor start
advisor ask
advisor resume
advisor review
advisor doctor
```

## 2. advisor init

初始化当前项目。

```bash
advisor init
advisor init --mode simple
advisor init --mode openspec
advisor init --with-openspec
advisor init --yes
advisor init --force
advisor init --skills claude,codex
advisor init --skills-manager-only
```

行为：检测项目、检测 OpenSpec、选择模式、生成配置、创建 handoff 目录、注入 AGENTS.md、导出 Skills。

## 3. advisor start

开始一个任务，生成 `EXECUTOR_TASK.md`。

```bash
advisor start
advisor start --change add-local-project-storage --tasks "1-2" --copy
advisor start --title "优化人工确认页面 UI" --scope "src/pages/HumanConfirm.tsx,src/components/**" --copy
advisor start --lane ui --tasks "3-4" --copy
```

无参数时走交互式选择。

## 4. advisor ask

卡住时生成 `ASK_ADVISOR.md`。

```bash
advisor ask
advisor ask --run build
advisor ask --lane ui --copy
advisor ask --change add-local-project-storage --copy
```

收集：git status、git diff、OpenSpec、构建/测试错误、当前 Executor task。

## 5. advisor resume

顾问回复后生成继续执行提示。

```bash
advisor resume
advisor resume --from clipboard
advisor resume --lane ui --copy
```

读取 `ADVISOR_DECISION.md`，输出 `RESUME_PROMPT.md`。

## 6. advisor review

生成 Review 请求。

```bash
advisor review
advisor review --lane ui --copy
advisor review --run current --copy
```

输出 `REVIEW_REQUEST.md`。

## 7. advisor doctor

检查：config、AGENTS.md、skills、handoff 目录、OpenSpec、package scripts、current run/lane、未处理 ASK/DECISION。


## 9. advisor sync --skills

同步 advisor Skills。

```bash
advisor sync --skills
advisor sync --skills --target claude
advisor sync --skills --target codex
advisor sync --skills --target all --scope project
advisor sync --skills --target all --scope user
advisor sync --skills --dry-run
advisor sync --skills --force
```

默认从：

```text
.advisor-kit/skills/
```

同步到项目级目标：

```text
.claude/skills/
.agents/skills/
```

规则：

1. 默认只同步当前项目配置启用的项目级目标；
2. 用户级目录只在显式传入 `--scope user` 时写入；
3. Codex 目标使用 `.agents/skills` 或 `~/.agents/skills`，不使用 `.codex/skills`；
4. 默认不覆盖疑似被用户修改过的目标 Skill；
5. `--force` 允许覆盖冲突文件；
6. `--dry-run` 只输出同步计划，不写入文件或同步状态；
7. 命令输出同步报告，包含目标、文件动作和汇总结果。
