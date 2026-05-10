## Context

当前实现中，`advisor init` 通过 `installProjectSkills` 从包内 `skills/` 导出默认 Skills 到 `.advisor-kit/skills`、`.claude/skills` 和 `.agents/skills`。配置中已经存在 `skills.install.manager`、`claudeProject`、`codexProject`、`claudeUser`、`codexUser`，文档也已经明确 `.advisor-kit/skills` 是 advisor-kit 的管理副本。

本次变更要补齐后续同步能力：当项目管理副本发生变化时，用户可以运行 `advisor sync --skills`，把 `.advisor-kit/skills` 中的 `advisor-*` Skills 同步到具体工具目录。同步必须保守，尤其不能默认写入用户级目录，也不能覆盖用户修改过的目标 Skill。

## Goals / Non-Goals

**Goals:**

- 注册并实现 `advisor sync --skills`。
- 只同步 `.advisor-kit/skills` 下带 `SKILL.md` 的 `advisor-*` Skill 目录。
- 支持 `--target claude|codex|all`。
- 支持 `--scope project|user`。
- 默认同步到当前项目配置启用的项目级目标目录。
- 只有显式传入 `--scope user` 时才允许写入 `~/.claude/skills` 或 `~/.agents/skills`。
- 使用 `.agents/skills` 作为 Codex 目录，不使用 `.codex/skills` 作为默认目录。
- 默认跳过目标目录中疑似被用户修改过的文件；传入 `--force` 时才覆盖。
- 支持 `--dry-run`，输出计划但不创建目录、不复制文件、不更新同步状态。
- 输出可读同步报告，并让测试能验证报告中的 action。

**Non-Goals:**

- 不实现 sync 其他资源。
- 不同步 handoff 文档。
- 不自动安装 Claude Code、Codex 或其他模型工具。
- 不自动调用模型 API。
- 不提供 GUI。
- 不改变 `advisor init` 的初始化范围，除非实现复用需要抽取共享函数。

## Decisions

### 1. 命令入口使用 `advisor sync --skills`

新增 `registerSyncCommand(program)`，在 `src/cli.ts` 中注册 `sync` 命令。`sync` 当前只接受 `--skills`，没有该参数时应报错并提示当前只支持 Skills 同步。

原因：文档已经把 `advisor sync --skills` 作为后续统一更新入口；保留 `sync` 命令空间可以避免未来扩展时破坏命令形状，但本次不实现其他资源。

### 2. 源目录固定为 `.advisor-kit/skills`

同步源只来自当前项目：

```text
.advisor-kit/skills/<skill-name>/
```

实现应扫描源目录中名称匹配 `advisor-*` 且包含 `SKILL.md` 的目录，并复制整个 Skill 目录。这样可以支持 `advisor-docs`、`advisor-lane-planner` 或未来新增 advisor Skill，只要它们已经进入管理副本。

如果 `.advisor-kit/config.json` 或 `.advisor-kit/skills` 缺失，应给出明确错误，引导用户先运行 `advisor init`。

### 3. 默认目标来自项目配置

未传 `--target` 和 `--scope` 时，目标解析为当前配置启用的项目级目录：

```text
config.skills.install.claudeProject -> .claude/skills
config.skills.install.codexProject  -> .agents/skills
```

显式传入 `--target` 时，以用户参数为准：

```text
--target claude -> Claude 目标
--target codex  -> Codex 目标
--target all    -> Claude + Codex 目标
```

未传 `--scope` 时默认为 `project`。传入 `--scope user` 时只解析用户级目录：

```text
claude -> ~/.claude/skills
codex  -> ~/.agents/skills
```

如果用户只传 `--scope user` 而未传 `--target`，则读取 `config.skills.install.claudeUser` 和 `config.skills.install.codexUser`。如果两者都未启用，命令应拒绝写入并提示需要显式选择 `--target`，避免一次命令意外写入所有用户级目录。

### 4. 用同步 manifest 判断是否安全覆盖

仅比较源文件和目标文件无法区分“目标被用户改过”和“源副本更新后目标还没同步”。为避免误覆盖，新增同步状态文件：

```text
.advisor-kit/skills-sync.json
```

建议 schema：

```json
{
  "version": 1,
  "records": {
    "project:claude:advisor-planner/SKILL.md": {
      "sourceHash": "sha256:...",
      "targetHash": "sha256:...",
      "syncedAt": "2026-05-10T00:00:00.000Z"
    }
  }
}
```

同步每个文件时按以下规则处理：

- 目标不存在：创建文件，记录 hash。
- 目标存在且内容与源一致：标记 `unchanged`，补齐或刷新 manifest。
- 目标存在且 manifest 记录的 `targetHash` 等于当前目标 hash：说明目标未被用户改过，可以更新为当前源内容。
- 目标存在但当前目标 hash 与 manifest 记录不一致：标记 `conflict` 并跳过。
- 目标存在但没有 manifest 记录且内容不同：保守视为 `conflict` 并跳过。
- 传入 `--force` 时，`conflict` 文件可被源内容覆盖，并更新 manifest。

manifest 只放在项目 `.advisor-kit` 下，用户级目标也记录在当前项目的 manifest 中。原因是同步动作由当前项目发起，状态应随项目配置和管理副本保存，且不需要在用户主目录写额外控制文件。

### 5. `--dry-run` 不产生任何写入

`--dry-run` 必须只计算 source、target 和 action，并输出报告。它不得：

- 创建目标目录；
- 复制或覆盖文件；
- 写入 `.advisor-kit/skills-sync.json`；
- 修改 `.advisor-kit/config.json`；
- 修改用户级目录。

这使用户可以先审计同步计划，尤其是用户级目录和 `--force` 场景。

### 6. 同步报告作为核心输出

命令输出应包含：

- source 根目录；
- resolved target 列表；
- scope 和 target 参数；
- 每个 Skill 或文件的 action；
- 汇总数量：created、updated、unchanged、skipped、conflicts；
- dry-run 或 force 标记。

建议 action 名称保持稳定，便于测试和用户理解：

```text
create
update
unchanged
conflict
skip
```

当存在 conflict 且未传 `--force` 时，命令可以使用非零退出码，或保持零退出码但在报告中明确“部分文件未同步”。实现前需要在任务中确认当前 CLI 风格；建议优先抛错或设置非零退出码，避免 CI 中误判同步成功。

## Risks / Trade-offs

- [Risk] 新增 manifest 会让实现比直接复制复杂。  
  Mitigation: 只记录文件级 hash，不引入复杂数据库；dry-run 和报告可以复用同一套 plan 结果。
- [Risk] 没有 manifest 的既有项目会把不同内容视为 conflict，可能导致第一次同步不更新。  
  Mitigation: 这是保守策略，用户可以先审计报告，再用 `--force` 明确覆盖。
- [Risk] 用户级目标记录在项目 manifest 中，多个项目同步同一个用户级 Skill 时会各自维护状态。  
  Mitigation: 用户级写入必须显式 `--scope user`，目标冲突默认跳过；跨项目共享本身需要用户明确选择。
- [Risk] 同步整个 Skill 目录时可能遇到非文件条目或嵌套目录。  
  Mitigation: 复用或扩展现有 `copyDirectory` 思路，只处理普通文件和目录，忽略符号链接等特殊条目并在报告中记录 skip。

## Migration Plan

- 已初始化项目无需迁移配置；现有 `skills.install` 字段可直接用于默认项目级目标解析。
- 首次运行 `advisor sync --skills` 时生成 `.advisor-kit/skills-sync.json`。
- 对没有 manifest 的既有目标目录，如果内容和源一致则记录为已同步；如果不同则跳过并要求用户显式 `--force`。

## Open Questions

- 遇到 conflict 时 CLI 是否应该直接失败并设置非零退出码，还是只在报告中标记部分失败？建议实现阶段以测试固化一个行为。
- 是否需要把 `.advisor-kit/skills-sync.json` 纳入推荐提交范围？建议默认可提交，因为它记录的是项目级同步安全状态；但 README 可以说明团队也可以选择不提交。
