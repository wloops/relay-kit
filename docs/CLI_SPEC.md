# CLI 规格

## 1. 全部命令

```bash
relay init
relay openspec <action>
relay start
relay ask
relay resume
relay review
relay doctor
relay sync
```

## 2. relay init

初始化当前项目，交互式选择 simple / openspec 模式。

```bash
relay init
relay init --mode simple
relay init --mode openspec
relay init --mode openspec --openspec-sync use_relay
relay init --with-openspec
relay init --yes
relay init --force
```

行为：
- 无 `openspec/` 时弹出菜单选择模式
- OpenSpec 模式自动创建 `openspec/` 目录结构
- 检测到外部 `openspec` CLI 时提供选项
- 生成配置、状态、handoff 目录、AGENTS.md 注入、安装 Skills/OpenSpec 文件

## 3. relay openspec（内置 OpenSpec CLI）

### relay openspec new-change

```bash
relay openspec new-change <name>
relay openspec new-change <name> --schema spec-driven
```

创建 `openspec/changes/<name>/` 目录和 `.openspec.yaml`。

### relay openspec status

```bash
relay openspec status --change <name>
relay openspec status --change <name> --json
```

输出 artifact 完成状态（proposal / specs / design / tasks 各自 done/ready/blocked）。

### relay openspec list

```bash
relay openspec list
relay openspec list --json
```

列出所有活跃 changes（排除 archive/）。

### relay openspec instructions

```bash
relay openspec instructions <artifactId> --change <name>
relay openspec instructions <artifactId> --change <name> --json
```

输出指定 artifact 的创建指引，包含 context、rules、template、instruction、outputPath、dependencies。

### relay openspec apply-instructions

```bash
relay openspec apply-instructions --change <name>
relay openspec apply-instructions --change <name> --json
```

输出 apply 执行上下文：contextFiles 映射、任务进度（total/complete/remaining）、state（ready/blocked/all_done）。

### relay openspec archive

```bash
relay openspec archive <name>
```

归档 change 到 `openspec/changes/archive/YYYY-MM-DD-<name>/`。

### relay openspec schemas

```bash
relay openspec schemas
```

列出可用 workflow schema 及其 artifact 列表。

## 4. relay start

开始一次 handoff run，生成 `EXECUTOR_TASK.md`。

```bash
relay start
relay start --change add-local-project-storage --title "实现本地存储"
relay start --title "优化 UI" --scope "src/pages/**" --blocked-scope "不要改 API"
relay start --copy
```

OpenSpec 模式下自动读取 change 的 proposal/design/tasks 并注入到 handoff 文件。

## 5. relay ask

Executor 卡住时生成 `ASK_ADVISOR.md`。

```bash
relay ask
relay ask --run build
relay ask --run test
relay ask --copy
```

收集：git status / diff、OpenSpec 上下文、构建/测试错误、当前 task。默认只收集现有上下文，传递 `--run` 才会执行命令。

## 6. relay resume

读取 Advisor 决策并生成 `RESUME_PROMPT.md`。

```bash
relay resume
relay resume --from ./ADVISOR_DECISION.md
relay resume --copy
```

## 7. relay review

生成 `REVIEW_REQUEST.md`。

```bash
relay review
relay review --copy
```

收集当前任务、OpenSpec 上下文、受限 git diff。

## 8. relay doctor

诊断项目接入状态：配置、AGENTS.md 注入块、Skills 目录、handoff 目录、OpenSpec 状态、package scripts、当前 run/lane。

```bash
relay doctor
```

## 9. relay sync

同步 relay-kit 管理的资源。

```bash
relay sync --skills                    # 同步 relay Skills
relay sync --openspec                  # 同步 OpenSpec 命令/Skill 文件
relay sync --all                       # 全量同步
relay sync --skills --target claude
relay sync --skills --target codex
relay sync --skills --target all --scope project
relay sync --skills --target all --scope user
relay sync --skills --dry-run
relay sync --skills --force
```

规则：
1. 默认只同步当前项目配置启用的项目级目标
2. 用户级目录只在显式传入 `--scope user` 时写入
3. Codex 目标使用 `.agents/skills`，不使用 `.codex/skills`
4. 默认不覆盖疑似被用户修改过的目标 Skill
5. `--force` 允许覆盖冲突文件
6. `--dry-run` 只输出同步计划，不写入文件
