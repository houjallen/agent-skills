# 示例：基于文件的规划实战

## 示例 1：研究任务

**用户请求：** "研究晨练的好处并写一份总结"

### 循环 1：创建计划
```bash
# 推荐：先用 init 脚本落地三件套到 .easbot/knowledge/tasks/{task-name}/
npx tsx scripts/init-planning-session.ts \
  --output .easbot/knowledge/tasks/{task-name}

# 然后编辑 task_plan.md 填入具体目标与阶段
```

```markdown
# 任务计划：晨练益处研究

## 目标
创建一份关于晨练益处的研究总结。

## 阶段
- [ ] 阶段 1：创建此计划 ✓
- [ ] 阶段 2：搜索并收集来源
- [ ] 阶段 3：综合发现
- [ ] 阶段 4：交付总结

## 关键问题
1. 身体健康方面有哪些益处？
2. 心理健康方面有哪些益处？
3. 有哪些科学研究支持这些观点？

## 状态
**当前处于阶段 1** - 创建计划
```

### 循环 2：研究
```bash
Read task_plan.md           # 刷新目标
WebSearch "morning exercise benefits" (晨练的好处)
Write notes.md              # 存储发现
Edit task_plan.md           # 标记阶段 2 完成
```

### 循环 3：综合
```bash
Read task_plan.md           # 刷新目标
Read notes.md               # 获取发现
Write morning_exercise_summary.md (晨练总结.md)
Edit task_plan.md           # 标记阶段 3 完成
```

### 循环 4：交付
```bash
Read task_plan.md           # 验证完成
Deliver morning_exercise_summary.md
```

> 任务文件位于 `.easbot/knowledge/tasks/{task-name}/`（决策 0034），**不进 git**。

---

## 示例 2：Bug 修复任务

**用户请求：** "修复认证模块中的登录 Bug"

### task_plan.md
```markdown
# 任务计划：修复登录 Bug

## 目标
识别并修复导致登录失败的 Bug。

## 阶段
- [x] 阶段 1：理解 Bug 报告 ✓
- [x] 阶段 2：定位相关代码 ✓
- [ ] 阶段 3：确定根本原因 (当前)
- [ ] 阶段 4：实施修复
- [ ] 阶段 5：测试和验证

## 关键问题
1. 出现了什么错误信息？
2. 哪个文件处理认证？
3. 最近有什么变动？

## 已做决策
- Auth 处理程序位于 src/auth/login.ts
- 错误发生在 validateToken() 函数中

## 遇到的错误
- [Initial] TypeError: Cannot read property 'token' of undefined
  → 根本原因：未正确等待 user 对象 (await)

## 状态
**当前处于阶段 3** - 找到根本原因，准备修复
```

---

## 示例 3：功能开发

**用户请求：** "给设置页面添加暗黑模式切换"

### 三文件模式实战 (The 3-File Pattern)

**task_plan.md:**
```markdown
# 任务计划：暗黑模式切换

## 目标
向设置添加功能性的暗黑模式切换。

## 阶段
- [x] 阶段 1：研究现有主题系统 ✓
- [x] 阶段 2：设计实现方案 ✓
- [ ] 阶段 3：实现切换组件 (当前)
- [ ] 阶段 4：添加主题切换逻辑
- [ ] 阶段 5：测试和完善

## 已做决策
- 使用 CSS 自定义属性作为主题
- 将偏好存储在 localStorage 中
- 切换组件位于 SettingsPage.tsx

## 状态
**当前处于阶段 3** - 构建切换组件
```

**notes.md:**
```markdown
# 笔记：暗黑模式实现

## 现有主题系统
- 位于：src/styles/theme.ts
- 使用：CSS 自定义属性
- 当前主题：仅亮色

## 需要修改的文件
1. src/styles/theme.ts - 添加暗色主题颜色
2. src/components/SettingsPage.tsx - 添加切换开关
3. src/hooks/useTheme.ts - 创建新 Hook
4. src/App.tsx - 使用 ThemeProvider 包裹

## 颜色决策
- 暗色背景：#1a1a2e
- 暗色表面：#16213e
- 暗色文本：#eaeaea
```

**dark_mode_implementation.md:** (交付物)
```markdown
# 暗黑模式实现

## 所做更改

### 1. 添加了暗色主题颜色
文件：src/styles/theme.ts
...

### 2. 创建了 useTheme hook
文件：src/hooks/useTheme.ts
...
```

---

## 示例 4：错误恢复模式

当事情失败时，**不要**隐藏它：

### 之前 (错误做法)
```
Action: Read config.json
Error: File not found
Action: Read config.json  # 默默重试
Action: Read config.json  # 又一次重试
```

### 之后 (正确做法)
```
Action: Read config.json
Error: File not found

# Update task_plan.md:
## Errors Encountered
- config.json not found → Will create default config (将创建默认配置)

Action: Write config.json (default config)
Action: Read config.json
Success!
```

---

## 决策前阅读模式 (The Read-Before-Decide Pattern)

**在做出重大决策前，务必阅读你的计划：**

```
[发生了许多工具调用...]
[上下文变得很长...]
[最初的目标可能被遗忘...]

→ Read task_plan.md          # 这将目标带回注意力中！
→ Now make the decision      # 目标在上下文中是新鲜的
```

这就是为什么 Manus 可以处理约 50 次工具调用而不迷失方向。计划文件充当了“目标刷新”机制。
