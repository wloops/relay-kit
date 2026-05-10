# Run / Lane 设计

## 概念

```text
run = 一次开发运行，例如 add-local-project-storage
lane = run 里的一个执行分支，例如 storage / ui / tests
```

## 目录结构

```text
docs/agent-handoffs/
  runs/
    2026-05-10-add-local-project-storage/
      RUN.md
      TASK_BOARD.md
      lanes/
        main/
          EXECUTOR_TASK.md
          ASK_ADVISOR.md
          ADVISOR_DECISION.md
          RESUME_PROMPT.md
          REVIEW_REQUEST.md
          REVIEW_REPORT.md
      history/
```

MVP 即使只有单线，也使用 `lanes/main/`，后续并行时不用重构。

## 并行原则

适合并行：UI 细节、测试、文档、独立组件、独立页面。

不适合并行：数据模型、状态管理、路由、API contract、数据库 schema、核心业务流程。

并行时推荐使用 git worktree，避免多个 Executor 在同一工作区互相覆盖。
