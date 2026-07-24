# Scripts

可选辅助脚本。**主路径是手动复制模板**（见 [references/templates/](../references/templates/)）。

## `init-planning-session.ts` — 初始化三件套

从 `references/templates/` 读取模板，落地 `task_plan.md` / `findings.md` / `progress.md`。文件已存在则跳过；模板缺失直接报错。

```bash
npx tsx scripts/init-planning-session.ts \
  --output .easbot/knowledge/tasks/<task-name>
```

## `check-complete.ts` — 检查完成度

扫描 `task_plan.md`，统计 H3/H4 阶段状态，输出 `X/Y phases complete`。总 exit 0。

```bash
npx tsx scripts/check-complete.ts /path/to/task_plan.md
```