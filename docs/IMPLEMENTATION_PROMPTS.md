# 给 Claude Code / OpenCode 的实现提示词

## 第一轮：生成项目骨架

```text
我要开发一个 npm CLI 工具，项目名 ai-advisor-kit，命令名 advisor。

定位：
Skills-first、CLI-assisted 的 AI 编程 Advisor Strategy 工具包。
它不自动调用模型，不自动写业务代码，不自动提交 git。
它负责初始化规则、生成任务交接文件、生成求助包、生成 Review 请求。

MVP 命令：
advisor init
advisor start
advisor ask
advisor resume
advisor review
advisor doctor

技术栈：
Node.js + TypeScript
commander 或 cac
execa
fs-extra
zod
prompts
clipboardy
picocolors
tsup

第一步只做项目骨架：
1. package.json 配置 bin: advisor
2. TypeScript 配置
3. tsup build
4. src/cli.ts
5. 注册 init/start/ask/resume/review/doctor 命令
6. 每个命令先输出占位信息
7. templates 和 skills 目录先创建
8. 不实现复杂逻辑
```

## 第二轮：实现 init

```text
实现 advisor init 的 MVP。

要求：
1. 检测 git 仓库
2. 检测 package.json
3. 检测 openspec 目录
4. 交互选择 simple / openspec / 引导初始化 OpenSpec
5. 创建 .advisor-kit/config.json 和 state.json
6. 创建 docs/agent-handoffs/runs
7. 创建 AGENTS.md 或注入 advisor-kit 区块
8. 导出 skills/advisor-* 到 .advisor-kit/skills
9. 交互选择是否同步到 .claude/skills 和 .agents/skills
10. 默认不安装到 ~/.claude/skills 或 ~/.agents/skills
11. 不覆盖用户已有内容，除非确认
12. 完成后给验证命令
```

## 第三轮：实现 start

```text
实现 advisor start。

要求：
1. 读取 .advisor-kit/config.json
2. 获取或创建 current run/lane
3. simple 模式支持输入 title/scope
4. openspec 模式支持选择 change 和 tasks
5. 渲染 EXECUTOR_TASK.md
6. 输出文件路径
7. 支持 --copy
8. 不执行代码
```
