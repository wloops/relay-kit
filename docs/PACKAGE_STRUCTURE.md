# 推荐 npm 包结构

```text
ai-advisor-kit/
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
    AGENTS.advisor.md
    EXECUTOR_TASK.template.md
    ASK_ADVISOR.template.md
    ADVISOR_DECISION.template.md
    RESUME_PROMPT.template.md
    REVIEW_REQUEST.template.md
    REVIEW_REPORT.template.md
    TASK_BOARD.template.md
    config.template.json

  skills/
    advisor-planner/SKILL.md
    advisor-delegator/SKILL.md
    advisor-escalation/SKILL.md
    advisor-reviewer/SKILL.md
    advisor-lane-planner/SKILL.md
    advisor-docs/SKILL.md
```

## 项目接入后结构

```text
your-project/
  AGENTS.md

  .advisor-kit/
    config.json
    state.json
    skills/
      advisor-planner/SKILL.md
      advisor-delegator/SKILL.md
      advisor-escalation/SKILL.md
      advisor-reviewer/SKILL.md

  .claude/
    skills/
      advisor-planner/SKILL.md
      advisor-delegator/SKILL.md
      advisor-escalation/SKILL.md
      advisor-reviewer/SKILL.md

  .agents/
    skills/
      advisor-planner/SKILL.md
      advisor-delegator/SKILL.md
      advisor-escalation/SKILL.md
      advisor-reviewer/SKILL.md

  docs/
    agent-handoffs/
      runs/
```

说明：

```text
.advisor-kit/skills = advisor-kit 管理副本
.claude/skills      = Claude Code 项目级实际识别目录
.agents/skills      = Codex 项目级实际识别目录
```
