<p align="center">
  <img src="https://img.shields.io/npm/v/relay-kit.svg" alt="npm version">
  <img src="https://img.shields.io/node/v/relay-kit.svg" alt="node version">
  <img src="https://img.shields.io/npm/l/relay-kit.svg" alt="license">
</p>

# relay-kit 🔄

> **Skills-first, CLI-assisted AI programming relay workflow toolkit**
>
> Break AI programming into a relay race: Plan → Delegate → Execute → Escalate → Review.
> Built-in OpenSpec. Zero external dependencies.

```
                  ┌──────────────────────────────────────┐
                  │              Human Owner              │
                  │      Direction · Review · Commit      │
                  └────┬──────────┬──────────┬───────────┘
                       │ Plan      │ Escalate │ Review
                       ▼           ▼          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                     relay-kit Workflow                       │
  │                                                             │
  │   /relay:plan         relay ask         /relay:review       │
  │   Planner ───────────► ASK_ADVISOR ───► Reviewer            │
  │      │                     ▲                │               │
  │      │ Delegate            │ Escalate       │ Verdict       │
  │      ▼                     │                ▼               │
  │   relay start          /relay:run        ADVISOR_DECISION   │
  │   EXECUTOR_TASK ──────► Executor ───────► REPLAN / FIX     │
  │                                                             │
  │   Built-in OpenSpec (relay openspec)                         │
  │   new-change → status → instructions → archive              │
  └─────────────────────────────────────────────────────────────┘
```

---

## Why relay-kit?

|              | Raw AI Tools                   | Multi-Agent Frameworks    | **relay-kit**                          |
| ------------ | ----------------------------- | ------------------------- | -------------------------------------- |
| **Approach** | Chat-based coding             | Automated agent orchestration | **Human-led relay workflow**       |
| **Roles**    | None                          | Agents self-negotiate     | **Owner / Advisor / Executor**         |
| **Handoff**  | Copy-paste conversations      | Framework internal        | **Structured handoff files**           |
| **Blockers** | Manual prompts                | Auto-retry or fail        | **ASK_ADVISOR escalation → human call**|
| **Review**   | Manual diff review            | None                      | **REVIEW_REQUEST → verdict report**    |
| **Spec-driven** | None                       | Framework-dependent       | **Built-in spec-driven OpenSpec**      |
| **Deps**     | Zero                          | Heavy                     | **Zero external deps (CLI: commander)**|

relay-kit is not an auto-coding tool, nor a multi-agent framework. It's a set of **workflow patterns** that mirror how real teams work: PM plans → engineer builds → escalates when stuck → code review before merging.

---

## Quick Start

### Install

```bash
npm install -g relay-kit
relay --help
```

### Initialize

```bash
cd your-project
relay init
```

Without an existing `openspec/` directory, an interactive menu appears:

```
Select initialization mode:
  1. Simple mode  — relay-kit standalone (no OpenSpec)
  2. OpenSpec mode — integrated with OpenSpec for spec-driven development (recommended)
Choose mode (1/2, default 2):
```

Choosing OpenSpec mode auto-creates the `openspec/` structure and installs all bundled commands and Skills. If an external `openspec` CLI is detected, you'll be prompted to choose between the built-in or external version.

Skip prompts with:

```bash
relay init --mode openspec --yes
```

### Plan → Execute → Review

```bash
# 1. Create an OpenSpec change
relay openspec new-change add-login

# 2. Have the Advisor plan and generate artifacts (run in your AI tool)
# /opsx:propose add-login

# 3. Generate the executor task
relay start --change add-login --title "Implement login"

# 4. Hand off to the Executor (run in your AI tool)
# /relay:run

# 5. Generate an escalation package when stuck
relay ask

# 6. Advisor reviews the result
relay review
```

---

## Command Reference

### Core Commands

| Command | Description |
|---------|-------------|
| `relay init` | Initialize project (interactive simple / openspec mode selection) |
| `relay start` | Generate EXECUTOR_TASK.md to begin a handoff run |
| `relay ask` | Generate ASK_ADVISOR.md escalation package when Executor is stuck |
| `relay resume` | Read ADVISOR_DECISION.md and generate RESUME_PROMPT.md to continue |
| `relay review` | Generate REVIEW_REQUEST.md for Advisor code review |
| `relay doctor` | Diagnose current project integration status |
| `relay sync` | Sync Skills and OpenSpec files to target tool directories |

### relay openspec Subcommands (Built-in OpenSpec CLI)

| Command | Description |
|---------|-------------|
| `relay openspec new-change <name>` | Create a new OpenSpec change |
| `relay openspec status --change <name>` | Show artifact completion status |
| `relay openspec list` | List all active changes |
| `relay openspec instructions <id> --change <name>` | Get artifact creation guidance (template + rules) |
| `relay openspec apply-instructions --change <name>` | Get apply instructions and task progress |
| `relay openspec archive <name>` | Archive a completed change |
| `relay openspec schemas` | List available workflow schemas |

### relay sync Options

| Option | Description |
|--------|-------------|
| `relay sync --skills` | Sync relay Skills to target tool directories |
| `relay sync --openspec` | Sync OpenSpec command/skill files |
| `relay sync --all` | Sync everything (Skills + OpenSpec files) |
| `--target claude \| codex \| all` | Specify target tool |
| `--scope project \| user` | Project-level or user-level (default: project) |
| `--dry-run` | Preview sync plan without writing files |
| `--force` | Overwrite conflicted target files |

---

## Workflow

```
/relay:plan                 /opsx:propose              relay start
Planner ──────► PLAN_REPORT ───► proposal.md ───► EXECUTOR_TASK.md
(Advisor)                       design.md               (handoff file)
                                tasks.md
                                   │
                      ┌────────────┘
                      ▼
                /relay:run
                Executor ───► edit code ───► [x] complete tasks
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     Success              Stuck / Failed
          │                     │
          ▼                     ▼
    relay review           relay ask
    REVIEW_REQUEST.md      ASK_ADVISOR.md
          │                     │
          ▼                     ▼
    /relay:review          Advisor Decision
    Reviewer ───►               │
    APPROVE /             ┌─────┴──────────────┐
    NEEDS_CHANGES /       ▼                    ▼
    REPLAN_REQUIRED    CONTINUE            REPLAN / FIX
                         │                    │
                         ▼                    ▼
                    relay resume         Re-plan
                    RESUME_PROMPT.md     or DIRECT_FIX
```

---

## Directory Structure

After `relay init`:

```
your-project/
├── .relay/
│   ├── config.json          # Project configuration
│   ├── state.json           # Runtime state
│   └── skills/              # relay Skills managed copy
├── .relayignore             # Context collection ignore rules
├── .opencode/               # OpenSpec commands/skills for OpenCode
├── .claude/
│   ├── commands/opsx/       # OpenSpec commands for Claude Code
│   └── skills/              # relay + OpenSpec Skills
├── .codex/
│   └── skills/              # OpenSpec Skills for Codex
├── .agents/
│   └── skills/              # relay Skills for Codex
├── openspec/                # OpenSpec specification directory
│   ├── changes/             # Active changes
│   ├── specs/               # Global specs
│   └── changes/archive/     # Archived changes
├── docs/agent-handoffs/runs/  # Handoff files
└── AGENTS.md                # relay-kit execution rules injection
```

---

## Context Safety

`relay ask` and `relay review` apply **three layers of protection** when collecting context:

1. **Default ignores** — `.env`, `node_modules/`, `dist/`, `build/`, `*.pem`, `*.key`, etc.
2. **`.relayignore`** — Project-specific ignore rules with sensible defaults for sensitive paths.
3. **Basic redaction** — API keys, tokens, secrets, passwords, bearer tokens, private key blocks.

It's a guard layer against common leaks, not a full security scanner.

---

## License

[MIT](LICENSE)
