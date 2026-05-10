# CLI 规格

## 1. MVP 命令

```bash
relay init
relay start
relay ask
relay resume
relay review
relay doctor
```

## 2. relay init

初始化当前项目。

```bash
relay init
relay init --mode simple
relay init --mode openspec
relay init --with-openspec
relay init --yes
relay init --force
relay init --skills claude,codex
relay init --skills-manager-only
```

行为：检测项目、检测 OpenSpec、选择模式、生成配置、创建 handoff 目录、注入 AGENTS.md、导出 Skills。

## 3. relay start

开始一个任务，生成 `EXECUTOR_TASK.md`。

```bash
relay start
relay start --change add-local-project-storage --tasks "1-2" --copy
relay start --title "优化人工确认页面 UI" --scope "src/pages/HumanConfirm.tsx,src/components/**" --copy
relay start --lane ui --tasks "3-4" --copy
```

无参数时走交互式选择。

## 4. relay ask

卡住时生成 `ASK_ADVISOR.md`。

```bash
relay ask
relay ask --run build
relay ask --lane ui --copy
relay ask --change add-local-project-storage --copy
```

收集：git status、git diff、OpenSpec、构建/测试错误、当前 Executor task。

## 5. relay resume

顾问回复后生成继续执行提示。

```bash
relay resume
relay resume --from clipboard
relay resume --lane ui --copy
```

读取 `ADVISOR_DECISION.md`，输出 `RESUME_PROMPT.md`。

## 6. relay review

生成 Review 请求。

```bash
relay review
relay review --lane ui --copy
relay review --run current --copy
```

输出 `REVIEW_REQUEST.md`。

## 7. relay doctor

检查：config、AGENTS.md、skills、handoff 目录、OpenSpec、package scripts、current run/lane、未处理 ASK/DECISION。


## 9. relay sync --skills

同步 relay Skills。

```bash
relay sync --skills
relay sync --skills --target claude
relay sync --skills --target codex
relay sync --skills --target all --scope project
relay sync --skills --target all --scope user
relay sync --skills --dry-run
relay sync --skills --force
```

默认从：

```text
.relay/skills/
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
