# Skills 安装与同步策略

## 1. 核心结论

`relay-kit` 采用 **项目级 Skills 默认安装，用户级 Skills 可选安装** 的策略。

原因：

1. 项目级 Skills 跟项目绑定，适合版本管理；
2. 不污染用户所有项目；
3. 不同项目可以有不同的 relay 工作流；
4. 适合团队协作和作品集展示；
5. 后续可通过 `relay sync --skills` 更新。

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

## 3. relay-kit 管理副本

无论用户选择哪些工具，`relay init` 都应该生成 relay-kit 自己的管理副本：

```text
.relay/
  skills/
    relay-planner/
      SKILL.md
    relay-delegator/
      SKILL.md
    relay-escalation/
      SKILL.md
    relay-reviewer/
      SKILL.md
```

它的作用：

```text
1. 作为 relay-kit 的源副本；
2. 方便 relay sync 统一更新；
3. 方便项目自己保留一份完整工作流；
4. 不依赖某个具体 AI 工具的扫描目录。
```

## 4. 默认安装目标

`relay init` 默认建议安装：

```text
[✓] .relay/skills   relay-kit 管理副本，必选
[✓] .claude/skills        Claude Code 项目级 Skills
[✓] .agents/skills        Codex 项目级 Skills
[ ] ~/.claude/skills      Claude Code 用户级 Skills
[ ] ~/.agents/skills      Codex 用户级 Skills
```

默认不安装用户级，除非用户明确选择。

## 5. MVP 默认安装哪些 Skills

MVP 默认安装 4 个：

```text
relay-planner
relay-delegator
relay-escalation
relay-reviewer
```

可选安装：

```text
relay-lane-planner
relay-docs
```

## 6. relay init 交互设计

```text
请选择要同步 Skills 的目标：

[✓] .relay/skills   relay-kit 管理副本，必选
[✓] .claude/skills        Claude Code 项目级，推荐
[✓] .agents/skills        Codex 项目级，推荐
[ ] ~/.claude/skills      Claude Code 用户级，高级选项
[ ] ~/.agents/skills      Codex 用户级，高级选项
```

如果用户不使用某个工具，可以取消对应目标。

## 7. 目录生成示例

```text
your-project/
  .relay/
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
```

## 8. sync 命令设计

### 同步所有项目级 Skills

```bash
relay sync --skills
```

默认从：

```text
.relay/skills/
```

同步到当前项目已启用的目标：

```text
.claude/skills/
.agents/skills/
```

### 指定目标

```bash
relay sync --skills --target claude
relay sync --skills --target codex
relay sync --skills --target all
```

### 指定作用域

```bash
relay sync --skills --target claude --scope project
relay sync --skills --target claude --scope user
relay sync --skills --target all --scope project
relay sync --skills --target all --scope user
```

## 9. 配置字段

`.relay/config.json` 增加：

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
      "relay-planner",
      "relay-delegator",
      "relay-escalation",
      "relay-reviewer"
    ],
    "optional": [
      "relay-lane-planner",
      "relay-docs"
    ]
  }
}
```

## 10. Git 提交建议

建议提交：

```text
.relay/skills/
.claude/skills/
.agents/skills/
```

如果团队不希望提交工具目录，可以只提交：

```text
.relay/skills/
```

然后让每个成员本地运行：

```bash
relay sync --skills
```

## 11. 最终规则

```text
1. .relay/skills 是 relay-kit 管理副本，默认必装。
2. .claude/skills 是 Claude Code 项目级实际识别目录。
3. .agents/skills 是 Codex 项目级实际识别目录。
4. 不使用 .codex/skills 作为默认目录。
5. 默认安装项目级，不默认安装用户级。
6. 用户级通过 relay sync --skills --scope user 手动开启。
7. sync 负责把管理副本同步到具体工具目录。
```
