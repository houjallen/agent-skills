---
name: eas-planning-writer
version: "1.0.0"
description: 实现 Manus 风格的基于文件的复杂任务规划。创建 task_plan.md、findings.md 和 progress.md。在开始复杂的多步骤任务、研究项目或任何需要超过 5 次工具调用的任务时使用。现已支持 /clear 后的自动会话恢复。
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebFetch
  - WebSearch
hooks:
  PreToolUse:
    - matcher: "Write|Edit|Bash|Read|Glob|Grep"
      hooks:
        - type: command
          command: "cat task_plan.md 2>/dev/null | head -30 || true"
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "echo '[eas-planning-writer] File updated. If this completes a phase, update task_plan.md status.'"
  Stop:
    - hooks:
        - type: command
          command: |
             SCRIPT_DIR="./scripts"

            IS_WINDOWS=0
            if [ "${OS-}" = "Windows_NT" ]; then
              IS_WINDOWS=1
            else
              UNAME_S="$(uname -s 2>/dev/null || echo '')"
              case "$UNAME_S" in
                CYGWIN*|MINGW*|MSYS*) IS_WINDOWS=1 ;;
              esac
            fi

             if [ "$IS_WINDOWS" -eq 1 ]; then
               if command -v pwsh >/dev/null 2>&1; then  
                 pwsh -ExecutionPolicy Bypass -File "$SCRIPT_DIR/check-complete.ps1"
               else
                 powershell -ExecutionPolicy Bypass -File "$SCRIPT_DIR/check-complete.ps1"
               fi
             else
               sh "$SCRIPT_DIR/check-complete.sh"
             fi
---

# 基于文件的规划 (Planning with Files)

像 Manus 一样工作：使用持久化的 Markdown 文件作为你的“磁盘上的工作记忆”。

## 第一步：检查之前的会话 (v2.2.0)

**在开始工作之前**，检查是否有来自上一次会话的未同步上下文：

```bash
# Linux/macOS
python3 scripts/session-catchup.py "$(pwd)"
```

```powershell
# Windows PowerShell
python .\scripts\session-catchup.py "$(Get-Location)"
```

如果同步报告显示有未同步的上下文：
1. 运行 `git diff --stat` 查看实际的代码变更
2. 读取当前的规划文件
3. 根据同步报告和 git diff 更新规划文件
4. 然后继续执行任务

## 重要：文件放在哪里

- **模板** 位于技能目录 `references/templates/`
- **你的规划文件** 放在 **你的项目目录** `docs/task/`中

| 位置                    | 放置内容 |
|-----------------------|-----------------|
| 技能目录 (`references/`)  | 模板、脚本、参考文档 |
| 你的项目目录(`docs/task/`)  | `task_plan.md`, `findings.md`, `progress.md` |

## 快速开始

在进行**任何**复杂任务之前：

1. **创建 `task_plan.md`** — 参考 [templates/task_plan.md 模板](references/templates/task_plan.md)
2. **创建 `findings.md`** — 参考 [templates/findings.md 模板](references/templates/findings.md)
3. **创建 `progress.md`** — 参考 [templates/progress.md 模板](references/templates/progress.md)
4. **决策前重读计划** — 刷新注意窗口中的目标
5. **每阶段后更新** — 标记完成，记录错误

> **注意：** 规划文件应放在你的项目的`docs/task/`目录下，而不是技能安装文件夹中。

## 核心模式

```
Context Window (上下文窗口) = RAM (易失性，有限)
Filesystem (文件系统) = Disk (持久性，无限)

→ 任何重要的东西都要写入磁盘。
```

## 文件用途

| 文件 | 用途        | 何时更新 |
|------|-----------|----------------|
| `task_plan.md` | 阶段、进度、决策  | 每个阶段后 |
| `findings.md` | 研究、发现、学习  | 任何发现后 |
| `progress.md` | 会话日志、测试结果 | 会话全程 |

## 关键规则

### 1. 先创建计划
永远不要在没有 `task_plan.md` 的情况下开始复杂任务。没得商量。

### 2. 双动作规则 (The 2-Action Rule)
> "每进行 2 次查看/浏览器/搜索操作后，**立即**将关键发现保存到文本文件中。"

这可以防止视觉/多模态信息丢失。

### 3. 决策前阅读
在做出重大决策之前，阅读计划文件。这能让目标保持在你的注意窗口中。

### 4. 行动后更新
完成任何阶段后：
- 标记阶段状态：`in_progress` → `complete`
- 记录遇到的任何错误
- 记录创建/修改的文件

### 5. 记录所有错误
每个错误都要进入计划文件。这能积累知识并防止重复。

```markdown
## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| FileNotFoundError | 1 | Created default config |
| API timeout | 2 | Added retry logic |
```

### 6. 永不重复失败
```
if action_failed:
    next_action != same_action
```
追踪你尝试过的方法。改变方法。

## 三次尝试错误协议

```
尝试 1：诊断与修复
  → 仔细阅读错误
  → 识别根本原因
  → 应用针对性修复

尝试 2：替代方案
  → 同样的错误？尝试不同的方法
  → 不同的工具？不同的库？
  → 永远不要重复完全相同的失败操作

尝试 3：更广泛的反思
  → 质疑假设
  → 搜索解决方案
  → 考虑更新计划

3次失败后：升级给用户
  → 解释你尝试了什么
  → 分享具体错误
  → 寻求指导
```

## 读 vs 写 决策矩阵

| 情况 | 动作 | 原因 |
|-----------|--------|--------|
| 刚写了一个文件 | **不要**读 | 内容还在上下文中 |
| 查看了图片/PDF | **立即**写 findings | 多模态 → 文本，防止丢失 |
| 浏览器返回数据 | 写入文件 | 截图不会持久保存 |
| 开始新阶段 | 阅读 plan/findings | 如果上下文陈旧，重新定位 |
| 发生错误 | 阅读相关文件 | 需要当前状态来修复 |
| 间隔后恢复 | 阅读所有规划文件 | 恢复状态 |

## 5个问题重启测试 (The 5-Question Reboot Test)

如果你能回答这些问题，说明你的上下文管理很稳固：

| 问题 | 答案来源 |
|----------|---------------|
| 我在哪？ | task_plan.md 中的当前阶段 |
| 我要去哪？ | 剩余阶段 |
| 目标是什么？ | 计划中的目标声明 |
| 我学到了什么？ | findings.md |
| 我做了什么？ | progress.md |

## 何时使用此模式

**适用于：**
- 多步骤任务（3步以上）
- 研究任务
- 构建/创建项目
- 跨越多次工具调用的任务
- 任何需要组织的任务

**跳过：**
- 简单问题
- 单文件编辑
- 快速查询

## 模板

复制这些模板开始：

- [templates/task_plan.md](references/templates/task_plan.md) — 阶段追踪
- [templates/findings.md](references/templates/findings.md) — 研究存储
- [templates/progress.md](references/templates/progress.md) — 会话日志

## 脚本

用于自动化的辅助脚本：

- `scripts/init-session.sh` — 初始化所有规划文件
- `scripts/check-complete.sh` — 验证所有阶段完成
- `scripts/session-catchup.py` — 从以前的会话恢复上下文 (v2.2.0)

## 高级主题

- **Manus 原则：** 见 [reference.md](references/reference.md)
- **真实示例：** 见 [examples.md](references/examples.md)

## 反模式

| 不要 | 应该 |
|-------|------------|
| 使用 TodoWrite 进行持久化 | 创建 task_plan.md 文件 |
| 陈述目标一次后就忘记 | 决策前重读计划 |
| 隐藏错误并默默重试 | 将错误记录到计划文件 |
| 把所有东西都塞进上下文 | 将大量内容存储在文件中 |
| 立即开始执行 | **先**创建计划文件 |
| 重复失败的动作 | 追踪尝试，改变方法 |
| 在技能目录中创建文件 | 在你的项目中创建文件 |
