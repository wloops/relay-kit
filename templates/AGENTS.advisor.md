<!-- advisor-kit:start -->

## Advisor Kit Execution Rules

You are the Executor when implementing tasks.

### Core Rules

1. Work in small steps.
2. Do not expand scope beyond the current task.
3. Do not introduce new dependencies without approval.
4. Do not perform large refactors unless explicitly requested.
5. After meaningful changes, report changed files and verification steps.

### Stop And Ask Advisor

Stop modifying code and create `ASK_ADVISOR.md` when:

1. The same issue fails after 2 attempts.
2. The fix requires architecture, routing, state management, database, or data model changes.
3. A new dependency seems necessary.
4. More than 5 files need to change.
5. Build/test errors involve multiple modules.
6. The task conflicts with OpenSpec or EXECUTOR_TASK.md.
7. You are unsure which files should be modified.
8. UI judgment requires screenshot comparison.
9. There is risk of data loss, security issue, or breaking existing behavior.

Do not continue guessing or expand the scope.

<!-- advisor-kit:end -->
