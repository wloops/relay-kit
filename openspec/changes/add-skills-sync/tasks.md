## 1. 命令入口与参数解析

- [x] 1.1 新增 `src/commands/sync.ts`，注册 `advisor sync` 命令并要求本次只支持 `--skills`。
- [x] 1.2 在 `src/cli.ts` 注册 sync 命令，确保 `advisor --help` 和 `advisor sync --help` 展示 `--skills`、`--target`、`--scope`、`--dry-run`、`--force`。
- [x] 1.3 定义并校验 `--target claude|codex|all`，非法值给出明确错误。
- [x] 1.4 定义并校验 `--scope project|user`，未传时默认使用 `project`。
- [x] 1.5 确保未传 `--skills` 时拒绝执行，并提示当前 `sync` 只支持 Skills。

## 2. 同步目标解析

- [x] 2.1 读取 `.advisor-kit/config.json`，复用现有 `loadConfig` 缺失提示。
- [x] 2.2 实现默认目标解析：`advisor sync --skills` 只同步到配置启用的项目级 `.claude/skills` 和 `.agents/skills`。
- [x] 2.3 实现显式 `--target claude|codex|all` 的项目级目标解析。
- [x] 2.4 实现显式 `--scope user` 的用户级目标解析：Claude 使用 `~/.claude/skills`，Codex 使用 `~/.agents/skills`。
- [x] 2.5 确保没有显式 `--scope user` 时不会创建或写入任何用户级目录。
- [x] 2.6 确保 Codex 目标始终使用 `.agents/skills` 或 `~/.agents/skills`，不使用 `.codex/skills`。

## 3. Skills 源扫描与同步计划

- [x] 3.1 从 `.advisor-kit/skills` 扫描包含 `SKILL.md` 的 `advisor-*` 目录，忽略非 advisor 目录。
- [x] 3.2 对每个 Skill 目录递归枚举普通文件，保留相对路径用于目标复制。
- [x] 3.3 缺失 `.advisor-kit/skills` 或没有可同步 Skill 时输出明确错误或空报告。
- [x] 3.4 生成同步计划，标记每个文件的 `create`、`update`、`unchanged`、`conflict` 或 `skip` 动作。

## 4. 覆盖保护与同步状态

- [x] 4.1 新增 `.advisor-kit/skills-sync.json` 的读写逻辑，记录 source hash、target hash 和 syncedAt。
- [x] 4.2 使用文件 hash 判断目标文件是否仍等于上次同步结果。
- [x] 4.3 默认跳过没有安全覆盖依据的不同内容目标文件，并在计划中标记为 `conflict`。
- [x] 4.4 实现 `--force`，允许覆盖 conflict 文件并更新同步状态。
- [x] 4.5 首次同步时，如果目标文件内容与源文件一致，应补齐同步状态而不重复写文件。

## 5. dry-run 与报告输出

- [x] 5.1 实现 `--dry-run`，确保不创建目录、不复制文件、不更新 `.advisor-kit/skills-sync.json`。
- [x] 5.2 输出同步报告，包含 source、resolved targets、scope、dry-run、force 和各 action 数量。
- [x] 5.3 报告中列出每个 conflict 文件的目标路径和建议操作。
- [x] 5.4 明确存在 conflict 且未传 `--force` 时的退出行为，并用测试固定。

## 6. 测试

- [x] 6.1 为目标解析补充测试，覆盖默认项目级配置、`--target claude`、`--target codex`、`--target all`。
- [x] 6.2 为用户级作用域补充测试，确认只有显式 `--scope user` 才会写入 `~/.claude/skills` 或 `~/.agents/skills`。
- [x] 6.3 为 `.codex/skills` 负向行为补充测试，确认不会作为默认或 Codex 目标。
- [x] 6.4 为 dry-run 补充测试，确认不创建目标目录、不复制文件、不更新同步状态。
- [x] 6.5 为覆盖保护补充测试，覆盖 unchanged、update、conflict、force overwrite 和首次 manifest 补齐。
- [x] 6.6 为同步报告补充测试，覆盖 action 汇总和 conflict 路径输出。

## 7. 验证与文档

- [x] 7.1 运行 `pnpm test`。
- [x] 7.2 运行 `pnpm build`。
- [x] 7.3 根据实现结果更新 README 或 CLI 文档中的 `advisor sync --skills` 使用说明。
- [x] 7.4 手动验证一个已初始化项目的默认项目级同步流程。
- [x] 7.5 手动验证 `--dry-run`、`--force` 和 `--scope user --target all` 行为。
