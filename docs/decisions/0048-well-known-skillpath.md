---
title: .well-known/agent-skills index v1 新增 skillPath 字段（跨源 subpath 同构）
type: adr
date: 2026-08-04
status: accepted
deciders: Agent (Trae IDE · MiniMax-M3)
scope:
  - scripts/generate-well-known.ts
  - docs/schemas/agent-skills/index.v1.json
  - docs/schemas/agent-skills/validate-v1.cjs
related:
  - [AGENTS.md §11 决策文档与规划持久化](../AGENTS.md)
  - [scripts/generate-well-known.ts](../../scripts/generate-well-known.ts)（IndexSkill.skillPath）
  - [docs/schemas/agent-skills/index.v1.json](./index.v1.json)（v1 schema 镜像）
---

# ADR 0048：.well-known/agent-skills index v1 新增 skillPath 字段（2026-08-04）

## 背景 (Context)

`.well-known/agent-skills/index.json`（v1 schema）目前暴露 5 个字段：`name` / `description` / `sourceUrl` / `installName` / `scope`，由 `scripts/generate-well-known.ts` 生成。前端解析器拿到 index 后，需要把每个 skill **物化到本地 store**，物化路径通常按 "pluginSlug + skillName" 推算。

现实问题：

- **多源同 skill 名错位**：当同一个 skill 名既存在于 github 源（subpath `skills/builtin/<name>`）又存在于 well-known 源时，物化路径如果不携带源端 subpath，两个源的同名 skill 会被写到同一物理位置，后写入的覆盖前者。
- **store / lock 字段语义不一致**：store 的 `def.skillPath` 与 lock 的 `skillPath` 都是 POSIX 风格 subpath（含 category），但 well-known 源此前没有暴露 subpath，前端只能从 `sourceUrl` URL 字符串里反向解析，路径变更（如加 CDN 层 / 改 endpoint 拼接规则）会破坏解析。
- **物理布局表达不充分**：v1 schema 用 `sourceUrl` 的 `/skills/<cat>/<skill>/SKILL.md` 末段隐含表达 subpath，但 URL 是"访问路径"而非"源端布局"，二者耦合太紧。

## 决策 (Decision)

在 v1 index 必填字段中**追加 `skillPath`**：

- 格式：`skills/<category>/<skill-name>`（POSIX 风格，**与 `sourceUrl` 的 `/skills/...` 段完全对齐**）
- 与 `name` / `category` 的语义关系：`skillPath = skills/<category>/<name>`
- 必填（不是可选）—— 老 index 解析器按平铺 fallback 即可，向后兼容

落地三处：

1. `scripts/generate-well-known.ts` —— `IndexSkill.skillPath: string`（必填），由 `posix.join(SKILL_BUNDLE_DIR, category, skillName)` 生成
2. `docs/schemas/agent-skills/index.v1.json` —— `skill` 必填追加 `skillPath`，pattern `^skills/(?:builtin|tools)/[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$`
3. `docs/schemas/agent-skills/validate-v1.cjs` —— `RE.skillPath` 正则 + 结构对齐校验（确保末段 = `name`、中段不含 `/`）

## 备选方案 (Alternatives Considered)

| # | 方案 | 优点 | 缺点 | 取舍 |
|---|---|---|---|---|
| A | **追加 `skillPath` 字段（当前）** | 与 github 源 subpath 字段名一致；store 物化时直接用；老 index 兼容 fallback | 字段多 1 个，但 schema 仍是"字段最小化" | ✅ 采纳 |
| B | 不加字段，前端从 `sourceUrl` URL 字符串解析 subpath | schema 字段数不变 | URL 结构与 subpath 强耦合；改 endpoint 拼接规则就破坏解析；多源对比时正则解析脆弱 | ❌ 拒 |
| C | 改为 `category` + `subpath` 两个字段 | 表达更细（category 与 subpath 解耦） | 与 github 源端 `subpath` 字段语义不一致；前端需要把两个字段拼起来 | ❌ 拒 |
| D | 复用 `installName` 的 `owner/repo@skill` 解析 subpath | 少一个字段 | `@` 后只到 skill 名，不含 category，丢失物理分类信息 | ❌ 拒 |

## 影响 (Consequences)

### 正面

- **多源同 skill name 不再错位**：store 物化路径 `cacheDir/<pluginSlug>/<skillPath>/SKILL.md` 与 git clone 后结构**完全同构**，well-known 源与 github 源可并存。
- **schema 与 sourceUrl 解耦**：`sourceUrl` 是"如何访问"，`skillPath` 是"源端布局"，互不绑死。
- **前端解析简单**：`skillPath` 直接喂给 store 物化路径，无需正则解析 `sourceUrl`。

### 负面 / 风险

- **老 index 兼容性**：已发布的 v1 index（如果存在）没有 `skillPath` 字段。前端 MUST 按"无 skillPath → 平铺 fallback" 处理（已在决策中明示）。
- **校验器新增字段，CI 契约变更**：旧 index 重新生成前会校验失败——本次一并再生 `.well-known/agent-skills/index.json`（12 项 skill，全 OK）。
- **字段最小化原则的轻微妥协**：从 5 字段增至 6 字段；但仍严格剔除 `version` / `category` / `endpoint` / `tags` / `metadata` 等决策 0034 排除项。

### 落地动作 (Action Items)

- [x] `scripts/generate-well-known.ts` 写入 `skillPath` 字段（commit `37f116c`）
- [x] `docs/schemas/agent-skills/index.v1.json` schema 同步（commit `37f116c`）
- [x] `docs/schemas/agent-skills/validate-v1.cjs` 校验器同步（commit `37f116c`）
- [x] 用现有 `.well-known/agent-skills/index.json`（12 项）实测 `validate-v1.cjs` 零报错
- [ ] **本 ADR 文档落档**（commit 待补）
- [ ] 下次发布前重新生成 `.well-known/agent-skills/index.json`（如有遗漏项）
- [ ] 通知前端解析器按 `skillPath` 优先 / 平铺 fallback 顺序处理

## 回溯 (Reversal)

若未来 store 物化路径改为别的策略（如全量 hash 化、不依赖 subpath），`skillPath` 字段可降级为可选或删除。**当前决策影响面**仅限前端解析器与校验器，回滚成本低：删除 `skillPath` 必填约束 + 改写 3 处文件即可。

## 参考 (References)

- 既有评审：本次变更**未触发新评审**（仅 schema / 脚本同步，按 §10 自检通过即可；§14 评审触发条件见 §14.2，本变更范围不属于"新增技能 / 修改 description / 新增 scripts"，见下方注释）
- 上游决策：仓库编号跳跃（评审 0001-0003 → 决策 0048），保留 0004-0047 给未来评审 / 决策
- 行业实践：`sourceUrl` + `subpath` 双字段分离是 plugin 协议常见模式（如 VS Code Marketplace Extension Manifest）