# 使用流程

## 1. 第一次接入项目

```bash
relay init
```

无 `openspec/` 时弹出交互菜单选择模式。选择 OpenSpec 后自动创建目录结构并安装全套文件。

初始化后生成：

```
.relay/          # 配置 + 状态 + Skills
. relayignore   # 上下文忽略规则
.opencode/      # OpenCode 的 OpenSpec 命令/Skill
.claude/        # Claude Code 的 OpenSpec 命令 + Skills
.codex/         # Codex 的 OpenSpec Skills
.agents/        # Codex 的 relay Skills
openspec/       # OpenSpec 规范目录
AGENTS.md       # relay-kit 执行规则注入
```

## 2. 规划功能

对 Advisor（聪明模型）说：

```
用 relay-planner 帮我规划「本地项目存储」功能。
判断是否需要 OpenSpec，明确目标、范围、非目标，并拆成 tasks。
```

得到 `PLAN_REPORT` 后，如果推荐 OpenSpec 模式：

```bash
relay openspec new-change add-local-storage
```

然后在 AI 工具中运行 `/opsx:propose add-local-storage` 生成完整制品。

## 3. 委派给 Executor

```bash
relay start --change add-local-storage --title "实现本地项目存储"
```

生成 `EXECUTOR_TASK.md`，交给 Executor：

```
用 /relay:run 执行当前任务。
```

## 4. Executor 卡住

```bash
relay ask
```

生成 `ASK_ADVISOR.md`，交给 Advisor：

```
用 relay-escalation 分析这个 ASK_ADVISOR，输出 ADVISOR_DECISION。
```

## 5. Advisor 决策后继续

保存顾问回复为 `ADVISOR_DECISION.md`，运行：

```bash
relay resume
```

生成 `RESUME_PROMPT.md`，交给 Executor 继续。

## 6. 完成后 Review

```bash
relay review
```

生成 `REVIEW_REQUEST.md`，交给 Advisor：

```
用 relay-reviewer review 当前实现。先输出 REVIEW_REPORT。
```

## 7. 更新 relay-kit

```bash
npm update -g relay-kit
cd your-project
relay sync --all    # 全量更新 Skills + OpenSpec 文件
```

## 8. 最简心智模型

```
planner    → 规划
delegator  → 委派成 EXECUTOR_TASK
executor   → 小步执行，卡住求助
escalation → Advisor 决策
resume     → 拿决策继续
reviewer   → 审查 + 裁决
openspec   → 管理 change 生命周期
```
