# OpenSpec 集成策略

## 1. 基本原则

`relay-kit` 不替代 OpenSpec。

```text
OpenSpec 管任务定义
relay-kit 管任务交接、求助、Review
```

## 2. 没有 OpenSpec 时

`relay init` 提供选择：Simple 模式、OpenSpec 模式、引导初始化 OpenSpec。

默认不安装、不初始化。

## 3. 有 OpenSpec 时

检测到：

```text
openspec/
  project.md
  changes/
```

启用：

```json
{
  "mode": "openspec",
  "includeOpenSpec": true
}
```

`relay start` 会读取 proposal/design/tasks。

## 4. 和 /opsx:apply 的关系

不冲突。

```text
/opsx:apply = OpenSpec 原生执行
relay start = 生成给 Executor 的任务交接说明，不执行代码
relay ask = 卡住时整理求助包
relay review = 完成后整理 Review 请求
```

## 5. Change 策略

可以先规划多个 change，但一次只激活和执行一个 change。追求效率时，在一个 change 内拆 lane。
