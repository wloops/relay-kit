# Skills 安装与同步策略

## 1. 核心结论

`ai-advisor-kit` 采用 **项目级 Skills 默认安装，用户级 Skills 可选安装** 的策略。

原因：

1. 项目级 Skills 跟项目绑定，适合版本管理；
2. 不污染用户所有项目；
3. 不同项目可以有不同的 advisor 工作流；
4. 适合团队协作和作品集展示；
5. 后续可通过 `advisor sync --skills` 更新。

## 2. 不同工具的 Skills 目录

不同 AI Coding 工具的自动扫描目录不同，不能假设 `.agents/skills/` 被所有工具识别。

### Claude Code

项目级：

```text
.claude/skills/<skill-name>/SKILL.md
```

用户级：

```text
~/.claude/skills/<skill-name>/SKILL.md
```

### Codex

项目级：

```text
.agents/skills/<skill-name>/SKILL.md
```

用户级：

```text
~/.agents/skills/<skill-name>/SKILL.md
```

## 3. advisor-kit 管理副本

无论用户选择哪些工具，`advisor init` 都应该生成 advisor-kit 自己的管理副本：

```text
.advisor-kit/
  skills/
    advisor-planner/
      SKILL.md
    advisor-delegator/
      SKILL.md
    advisor-escalation/
      SKILL.md
    advisor-reviewer/
      SKILL.md
```

它的作用：

```text
1. 作为 advisor-kit 的源副本；
2. 方便 advisor sync 统一更新；
3. 方便项目自己保留一份完整工作流；
4. 不依赖某个具体 AI 工具的扫描目录。
```

## 4. 默认安装目标

`advisor init` 默认建议安装：

```text
[✓] .advisor-kit/skills   advisor-kit 管理副本，必选
[✓] .claude/skills        Claude Code 项目级 Skills
[✓] .agents/skills        Codex 项目级 Skills
[ ] ~/.claude/skills      Claude Code 用户级 Skills
[ ] ~/.agents/skills      Codex 用户级 Skills
```

默认不安装用户级，除非用户明确选择。

## 5. MVP 默认安装哪些 Skills

MVP 默认安装 4 个：

```text
advisor-planner
advisor-delegator
advisor-escalation
advisor-reviewer
```

可选安装：

```text
advisor-lane-planner
advisor-docs
```

## 6. advisor init 交互设计

```text
请选择要同步 Skills 的目标：

[✓] .advisor-kit/skills   advisor-kit 管理副本，必选
[✓] .claude/skills        Claude Code 项目级，推荐
[✓] .agents/skills        Codex 项目级，推荐
[ ] ~/.claude/skills      Claude Code 用户级，高级选项
[ ] ~/.agents/skills      Codex 用户级，高级选项
```

如果用户不使用某个工具，可以取消对应目标。

## 7. 目录生成示例

```text
your-project/
  .advisor-kit/
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
```

## 8. sync 命令设计

### 同步所有项目级 Skills

```bash
advisor sync --skills
```

默认从：

```text
.advisor-kit/skills/
```

同步到当前项目已启用的目标：

```text
.claude/skills/
.agents/skills/
```

### 指定目标

```bash
advisor sync --skills --target claude
advisor sync --skills --target codex
advisor sync --skills --target all
```

### 指定作用域

```bash
advisor sync --skills --target claude --scope project
advisor sync --skills --target claude --scope user
advisor sync --skills --target all --scope project
advisor sync --skills --target all --scope user
```

## 9. 配置字段

`.advisor-kit/config.json` 增加：

```json
{
  "skills": {
    "install": {
      "manager": true,
      "claudeProject": true,
      "codexProject": true,
      "claudeUser": false,
      "codexUser": false
    },
    "enabled": [
      "advisor-planner",
      "advisor-delegator",
      "advisor-escalation",
      "advisor-reviewer"
    ],
    "optional": [
      "advisor-lane-planner",
      "advisor-docs"
    ]
  }
}
```

## 10. Git 提交建议

建议提交：

```text
.advisor-kit/skills/
.claude/skills/
.agents/skills/
```

如果团队不希望提交工具目录，可以只提交：

```text
.advisor-kit/skills/
```

然后让每个成员本地运行：

```bash
advisor sync --skills
```

## 11. 最终规则

```text
1. .advisor-kit/skills 是 advisor-kit 管理副本，默认必装。
2. .claude/skills 是 Claude Code 项目级实际识别目录。
3. .agents/skills 是 Codex 项目级实际识别目录。
4. 不使用 .codex/skills 作为默认目录。
5. 默认安装项目级，不默认安装用户级。
6. 用户级通过 advisor sync --skills --scope user 手动开启。
7. sync 负责把管理副本同步到具体工具目录。
```
