# Scripts 使用说明 (Scripts Reference)

本目录提供 `eas-planning-writer` 技能所需的全部脚本。**统一使用 TypeScript**（与项目栈一致：ESM + `verbatimModuleSyntax` + Biome 2.4）。

## 脚本清单 (Scripts)

### `init-planning-session.ts` — 初始化三件套

从 `references/templates/` 读取模板，创建 `task_plan.md` / `findings.md` / `progress.md`。

```bash
# 默认输出到 ./docs/task（兼容旧调用方式）
npx tsx scripts/init-planning-session.ts

# 推荐：自定义输出目录（决策 0034）
npx tsx scripts/init-planning-session.ts \
  --output .easbot/knowledge/tasks/{task-name}

# 帮助
npx tsx scripts/init-planning-session.ts --help
```

特性：

- TypeScript ESM，类型安全
- 从模板动态读取，模板更新后无需改脚本
- 文件已存在则跳过，不会覆盖用户内容
- 模板缺失时回退到内置默认内容（避免硬编码分裂）
- 兼容 ESM 入口检测（`import.meta.url`）

### `check-complete.ts` — 检查完成度

扫描 `task_plan.md`，统计各阶段状态，输出 "X/Y phases complete"。

```bash
# 检查当前目录的 task_plan.md
npx tsx scripts/check-complete.ts

# 指定文件
npx tsx scripts/check-complete.ts /path/to/task_plan.md
```

特性：

- 同时支持 `**Status:** complete` 与 `[complete]` 两种格式
- 总 exit 0（未完成是正常状态）
- 用于 Stop hook 输出任务状态

### `session-catchup.ts` — Session 恢复

分析上一个 session 的会话日志，找出上次规划文件更新后的未同步上下文。

```bash
npx tsx scripts/session-catchup.ts "$(pwd)"
```

特性：

- 解析 `~/.easbot/sessions/` 下的 JSONL 会话日志
- 找出 `task_plan.md` / `findings.md` / `progress.md` 最后一次更新位置
- 输出未同步的最近 15 条消息
- 用于 SessionStart 时恢复上下文

> **依赖**：会话文件存放在 `~/.easbot/sessions/`。如果你的 Agent 会话存放在其他位置，需修改脚本中的 `getProjectDir()` 函数。

### `test_planning_writer.ts` — 烟雾测试

验证所有 .ts 脚本能正常执行、模板能正确生成。

```bash
npx tsx scripts/test_planning_writer.ts
```

测试覆盖：

- `init-planning-session.ts --help` 正常退出
- `init-planning-session.ts --output <dir>` 落盘三件套
- `check-complete.ts` 无参数 / 指定文件均正常工作
- `check-complete.ts` 报告阶段完成度（`1/2 phases complete`）
- `session-catchup.ts` 无项目历史时静默退出

## 通用工作流 (Typical Workflow)

```bash
# 1. 进入项目目录
cd /path/to/your/project

# 2. 初始化任务目录
npx tsx scripts/init-planning-session.ts \
  --output .easbot/knowledge/tasks/{task-name}

# 3. 编辑 task_plan.md 设定目标与阶段

# 4. 完成任务
# ... 执行任务 ...
# 期间使用 find / search 后立即更新 findings.md

# 5. 检查进度
npx tsx scripts/check-complete.ts \
  .easbot/knowledge/tasks/{task-name}/task_plan.md

# 6. Session 重启时恢复
npx tsx scripts/session-catchup.ts "$(pwd)"

# 7. 验证技能健康度
npx tsx scripts/test_planning_writer.ts
```

## 已废弃脚本 (Removed)

以下脚本已**物理删除**（不保留历史兼容）：

| 脚本族 | 原因 |
|--------|------|
| `init-session.sh` / `init-session.ps1` | sh/ps1 版本功能相同，硬编码默认内容 |
| `dynamic-init.sh` / `dynamic-init.py` / `dynamic-init.ts` | 早期重复实现 |
| `init_planning_session.py` | Python 版本，与 .ts 功能完全相同 |
| `check-complete.sh` / `check-complete.ps1` / `check_complete.py` | 多语言重复实现 |
| `session-catchup.py` | Python 版本，统一为 .ts |
| `test_planning_writer.py` | Python 测试，统一为 .ts |

如需历史参考，可在 git reflog 中找回。
