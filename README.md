<p align="center">
  <img src="https://img.shields.io/npm/v/relay-kit.svg" alt="npm version">
  <img src="https://img.shields.io/node/v/relay-kit.svg" alt="node version">
  <img src="https://img.shields.io/npm/l/relay-kit.svg" alt="license">
</p>

# relay-kit 🔄

> **Skills-first、CLI-assisted 的 AI 编程接力工作流工具包**
>
> 把 AI 编程拆成「规划 → 委派 → 执行 → 求助 → 审查」的接力赛。
> 内置 OpenSpec，零外部依赖。

```
                  ┌──────────────────────────────────────┐
                  │              人类 Owner               │
                  │          方向 · 验收 · 提交            │
                  └────┬──────────┬──────────┬───────────┘
                       │ 规划      │ 求助     │ 审查
                       ▼           ▼          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    relay-kit 工作流                          │
  │                                                             │
  │   /relay:plan         relay ask         /relay:review       │
  │   规划顾问 ──────────► ASK_ADVISOR ────► 审查顾问            │
  │      │                     ▲                │               │
  │      │ 委派                │ 升级           │ 裁决          │
  │      ▼                     │                ▼               │
  │   relay start          /relay:run        ADVISOR_DECISION   │
  │   EXECUTOR_TASK ──────► 执行者 ──────────► REPLAN / FIX     │
  │                                                             │
  │   内置 OpenSpec (relay openspec)                              │
  │   new-change → status → instructions → archive              │
  └─────────────────────────────────────────────────────────────┘
```

---

## 为什么 relay-kit？

|              | 裸用 AI 工具                  | 多 Agent 框架              | **relay-kit**                   |
| ------------ | ---------------------------- | ------------------------- | ------------------------------- |
| **定位**     | 聊天式编程                   | 自动化 Agent 协作         | **人工主导的接力工作流**        |
| **角色分工** | 无                           | Agent 自行协商            | **Owner / Advisor / Executor**  |
| **任务交接** | 粘贴对话                     | 框架内部传递              | **结构化的 handoff 文件**       |
| **卡住处理** | 手动问                       | 自动重试或失败            | **ASK_ADVISOR 升级 → 人工决策** |
| **代码审查** | 肉眼 diff                    | 无                        | **REVIEW_REQUEST → 裁决报告**   |
| **规范驱动** | 无                           | 取决于框架                | **内置 spec-driven OpenSpec**   |
| **依赖**     | 零                           | 重                        | **零外部依赖（CLI 仅 commander）** |

relay-kit 不是「自动写代码」工具，也不是「多 Agent 框架」。它是**把真实团队的工作流（PM 规划 → 工程师执行 → 卡住求助 → 代码审查）固化为 AI 可复用的流程**。

---

## 快速开始

### 安装

```bash
npm install -g relay-kit
relay --help
```

### 初始化项目

```bash
cd your-project
relay init
```

无 `openspec/` 时会弹出交互菜单：

```
Select initialization mode:
  1. Simple mode  — relay-kit standalone (no OpenSpec)
  2. OpenSpec mode — integrated with OpenSpec for spec-driven development (recommended)
Choose mode (1/2, default 2):
```

选择 OpenSpec 模式后自动创建 `openspec/` 结构并安装全套命令和 Skills。如果系统已安装过外部 `openspec` CLI，会提示选择使用内置还是外部版本。

也可以跳过交互直接指定：

```bash
relay init --mode openspec --yes
```

### 规划 → 执行 → 审查

```bash
# 1. 创建 OpenSpec change
relay openspec new-change add-login

# 2. 让 Advisor 规划并生成制品（在 AI 工具中运行）
# /opsx:propose add-login

# 3. 生成执行任务
relay start --change add-login --title "实现登录功能"

# 4. 交给 Executor 执行（在 AI 工具中运行）
# /relay:run

# 5. 卡住时生成求助包
relay ask

# 6. Advisor 审查
relay review
```

---

## 命令参考

### relay-kit 核心命令

| 命令 | 说明 |
|------|------|
| `relay init` | 初始化项目（交互式选择 simple / openspec 模式） |
| `relay start` | 生成 EXECUTOR_TASK.md，开始一次 handoff run |
| `relay ask` | Executor 卡住时生成 ASK_ADVISOR.md 求助包 |
| `relay resume` | 读取 ADVISOR_DECISION.md，生成 RESUME_PROMPT.md 继续执行 |
| `relay review` | 完成实现后生成 REVIEW_REQUEST.md，交给 Advisor 审查 |
| `relay doctor` | 诊断当前项目接入状态 |
| `relay sync` | 同步 Skills 和 OpenSpec 文件到目标工具目录 |

### relay openspec 子命令（内置 OpenSpec CLI）

| 命令 | 说明 |
|------|------|
| `relay openspec new-change <name>` | 创建新的 OpenSpec change |
| `relay openspec status --change <name>` | 查看 artifact 完成状态 |
| `relay openspec list` | 列出所有活跃 changes |
| `relay openspec instructions <id> --change <name>` | 获取 artifact 创建指引（模板 + 规则） |
| `relay openspec apply-instructions --change <name>` | 获取 apply 执行指引和任务进度 |
| `relay openspec archive <name>` | 归档已完成的 change |
| `relay openspec schemas` | 列出可用 workflow schema |

### relay sync 选项

| 选项 | 说明 |
|------|------|
| `relay sync --skills` | 同步 relay Skills 到项目工具目录 |
| `relay sync --openspec` | 同步 OpenSpec 命令/Skill 文件 |
| `relay sync --all` | 同步所有（Skills + OpenSpec 文件） |
| `--target claude \| codex \| all` | 指定同步目标工具 |
| `--scope project \| user` | 项目级或用户级（默认 project） |
| `--dry-run` | 预览同步计划，不写入文件 |
| `--force` | 覆盖冲突的目标文件 |

---

## 工作流

```
/relay:plan                 /opsx:propose              relay start
规划顾问 ───► PLAN_REPORT ───► proposal.md ───► EXECUTOR_TASK.md
(Advisor)                     design.md                 (handoff 文件)
                              tasks.md
                                 │
                    ┌────────────┘
                    ▼
              /relay:run
              执行者 ───► 修改代码 ───► [x] 完成任务
              (Executor)
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      成功完成            卡住 / 失败
          │                   │
          ▼                   ▼
    relay review          relay ask
    REVIEW_REQUEST.md     ASK_ADVISOR.md
          │                   │
          ▼                   ▼
    /relay:review         Advisor 决策
    审查顾问 ───►           │
    APPROVE /            ┌──┴──────────────┐
    NEEDS_CHANGES /      ▼                 ▼
    REPLAN_REQUIRED   CONTINUE          REPLAN / FIX
                       │                 │
                       ▼                 ▼
                  relay resume      重新规划
                  RESUME_PROMPT.md   或 DIRECT_FIX
```

---

## 安装与目录结构

`relay init` 后项目下生成：

```
your-project/
├── .relay/
│   ├── config.json          # 项目配置
│   ├── state.json           # 运行时状态
│   └── skills/              # relay Skills 管理副本
├── .relayignore             # 上下文收集忽略规则
├── .opencode/               # OpenCode 的 OpenSpec 命令/Skill
├── .claude/
│   ├── commands/opsx/       # Claude Code 的 OpenSpec 命令
│   └── skills/              # relay + OpenSpec Skills
├── .codex/
│   └── skills/              # Codex 的 OpenSpec Skills
├── .agents/
│   └── skills/              # Codex 的 relay Skills
├── openspec/                # OpenSpec 规范目录
│   ├── changes/             # 活跃 changes
│   ├── specs/               # 全局 spec
│   └── changes/archive/     # 已归档 changes
├── docs/agent-handoffs/runs/  # handoff 文件
└── AGENTS.md                # relay-kit 执行规则注入
```

---

## 上下文安全

`relay ask` 和 `relay review` 收集上下文时会应用**三层防护**：

1. **默认忽略** — `.env`, `node_modules/`, `dist/`, `build/`, `*.pem`, `*.key` 等
2. **`.relayignore`** — 项目自定义忽略规则，默认包含常见敏感路径
3. **基础脱敏** — API key, token, secret, password, bearer token, private key block

它不是完整安全扫描器，而是**防止常见泄露的保护层**。

---

## 许可

[MIT](LICENSE)
