## Why

`advisor init` 已经能把 advisor Skills 导出到项目级目录，但后续更新 `.advisor-kit/skills` 后缺少可重复、可审计的同步入口。需要新增 `advisor sync --skills`，让项目管理副本可以安全同步到 Claude Code 和 Codex 的实际 Skills 目录，同时避免默认污染用户级目录或覆盖用户修改。

## What Changes

- 新增 `advisor sync --skills` 命令，只处理 advisor Skills 同步。
- 从当前项目的 `.advisor-kit/skills` 读取 `advisor-*` Skills，并同步到具体 AI 工具的 Skills 目录：
  - Claude Code 项目级：`.claude/skills`
  - Codex 项目级：`.agents/skills`
  - Claude Code 用户级：`~/.claude/skills`
  - Codex 用户级：`~/.agents/skills`
- 支持目标参数：
  - `--target claude`
  - `--target codex`
  - `--target all`
- 支持作用域参数：
  - `--scope project`
  - `--scope user`
- 支持同步控制参数：
  - `--dry-run`：只输出将要同步的文件和动作，不写入文件或同步状态。
  - `--force`：允许覆盖目标目录中已存在且与上次同步记录不一致的文件。
- 默认行为：
  - `advisor sync --skills` 等价于从 `.advisor-kit/skills` 同步到当前项目配置启用的项目级目标目录。
  - 默认不写入用户级目录。
- 明确不使用 `.codex/skills` 作为 Codex 默认目录。
- 输出同步报告，展示每个目标、每个 Skill 的计划或执行结果。
- 补充测试覆盖 CLI 参数、目标解析、dry-run、force、用户级写入保护、同步报告和冲突跳过。

## Capabilities

### New Capabilities

- `skills-sync`：定义 advisor Skills 从 `.advisor-kit/skills` 安全同步到项目级或用户级工具目录的命令行为、覆盖规则和报告要求。

### Modified Capabilities

- 无。当前 `openspec/specs/` 下没有已发布 capability。

## Impact

- 影响 CLI 注册和命令实现：
  - `src/cli.ts`
  - 后续新增 `src/commands/sync.ts`
- 影响 Skills 相关核心逻辑：
  - `src/core/skills.ts`
  - 可能新增 `src/core/skills-sync.ts` 或等价模块
  - `src/core/types.ts`
- 影响配置和默认目标解析：
  - `.advisor-kit/config.json`
  - `templates/config.template.json`
- 影响测试：
  - `tests/commands.test.ts`
  - `tests/core.test.ts`
  - 可能新增专门的 sync 测试文件
- 不新增模型 API、GUI、自动工具安装、handoff 同步或其他资源同步。
