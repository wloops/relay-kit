# 推荐 npm 包结构

```text
relay-kit/
  package.json
  README.md
  tsconfig.json
  tsup.config.ts

  src/
    cli.ts
    commands/
      init.ts
      start.ts
      ask.ts
      resume.ts
      review.ts
      doctor.ts
    core/
      config.ts
      detectProject.ts
      git.ts
      collectContext.ts
      openSpec.ts
      runLane.ts
      renderTemplate.ts
      updateAgentsMd.ts
      skillExport.ts
      clipboard.ts
      safeWrite.ts
    types/
      config.ts
      context.ts
      runLane.ts

  templates/
    AGENTS.relay.md
    EXECUTOR_TASK.template.md
    ASK_ADVISOR.template.md
    ADVISOR_DECISION.template.md
    RESUME_PROMPT.template.md
    REVIEW_REQUEST.template.md
    REVIEW_REPORT.template.md
    TASK_BOARD.template.md
    config.template.json

  skills/
    relay-planner/SKILL.md
    relay-delegator/SKILL.md
    relay-escalation/SKILL.md
    relay-reviewer/SKILL.md
    relay-lane-planner/SKILL.md
    relay-docs/SKILL.md
```

## 项目接入后结构

```text
your-project/
  AGENTS.md

  .relay/
    config.json
    state.json
    skills/
      relay-planner/SKILL.md
      relay-delegator/SKILL.md
      relay-escalation/SKILL.md
      relay-reviewer/SKILL.md

  .claude/
    skills/
      relay-planner/SKILL.md
      relay-delegator/SKILL.md
      relay-escalation/SKILL.md
      relay-reviewer/SKILL.md

  .agents/
    skills/
      relay-planner/SKILL.md
      relay-delegator/SKILL.md
      relay-escalation/SKILL.md
      relay-reviewer/SKILL.md

  docs/
    agent-handoffs/
      runs/
```

说明：

```text
.relay/skills = relay-kit 管理副本
.claude/skills      = Claude Code 项目级实际识别目录
.agents/skills      = Codex 项目级实际识别目录
```
