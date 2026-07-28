# 示例：基于文件的规划实战

> 核心 8 步流程见 [SKILL.md](../SKILL.md#快速开始-quick-start)。本文件聚焦**不同类型任务的关键差异点**。

## 示例 1：研究任务

**用户请求：** "研究晨练的好处并写一份总结"

**与默认流程的差异**：阶段 3「综合发现」需交付独立报告 `morning_exercise_summary.md`，阶段 4「交付」即发布该文件。

```markdown
# 任务计划：晨练益处研究

## 目标
创建一份关于晨练益处的研究总结。

## 阶段
- [x] 阶段 1：创建此计划 ✓
- [ ] 阶段 2：搜索并收集来源
- [ ] 阶段 3：综合发现（输出 morning_exercise_summary.md）
- [ ] 阶段 4：交付总结

## 关键问题
1. 身体健康方面有哪些益处？
2. 心理健康方面有哪些益处？
3. 有哪些科学研究支持这些观点？
```

> 任务文件位于 `.easbot/knowledge/tasks/{task-name}/`（仓库隐藏知识目录），**不进 git**。

---

## 示例 2：Bug 修复任务

**用户请求：** "修复认证模块中的登录 Bug"

**与默认流程的差异**：阶段 3「确定根本原因」必须填"遇到的错误"表，**禁止隐藏失败**。

```markdown
# 任务计划：修复登录 Bug

## 阶段
- [x] 阶段 1：理解 Bug 报告 ✓
- [x] 阶段 2：定位相关代码 ✓
- [ ] 阶段 3：确定根本原因 (当前)
- [ ] 阶段 4：实施修复
- [ ] 阶段 5：测试和验证

## 已做决策
- Auth 处理程序位于 src/auth/login.ts
- 错误发生在 validateToken() 函数中

## 遇到的错误
- [Initial] TypeError: Cannot read property 'token' of undefined
  → 根本原因：未正确等待 user 对象 (await)
```

---

## 示例 3：功能开发

**用户请求：** "给设置页面添加暗黑模式切换"

**与默认流程的差异**：阶段 3-4 涉及多文件改动，**`findings.md` 必须列出受影响的文件清单**（便于 Review 时定位）。

```markdown
# findings.md：暗黑模式实现

## 受影响的文件
1. src/styles/theme.ts - 添加暗色主题颜色
2. src/components/SettingsPage.tsx - 添加切换开关
3. src/hooks/useTheme.ts - 创建新 Hook
4. src/App.tsx - 使用 ThemeProvider 包裹

## 颜色决策
- 暗色背景：#1a1a2e
- 暗色表面：#16213e
- 暗色文本：#eaeaea
```

---

## 示例 4：错误恢复模式

当事情失败时，**不要**隐藏它：

### ❌ 错误做法
```
Action: Read config.json
Error: File not found
Action: Read config.json  # 默默重试
Action: Read config.json  # 又一次重试
```

### ✅ 正确做法
```
Action: Read config.json
Error: File not found

# Update task_plan.md 错误表:
- config.json not found → Will create default config

Action: Write config.json (default config)
Action: Read config.json
Success!
```

参考 SKILL.md 的「三次尝试错误协议 (3-Attempt Error Protocol)」——失败 3 次后必须升级给用户。

---

## 决策前阅读模式 (The Read-Before-Decide Pattern)

长 session 后重读 `task_plan.md`，把目标拉回注意力窗口：

```
[发生了许多工具调用...]
[上下文变得很长...]
[最初的目标可能被遗忘...]

→ Read task_plan.md          # 把目标带回注意力窗口
→ Now make the decision      # 目标在上下文中是新鲜的
```
