# 7 步收尾 Checklist (Finish Checklist)

> **所属技能**：`eas-dev-finish`
> **目标**：详细解释 7 步收尾的具体动作 + 验证标准

---

## Step 1: 测试全绿 (Tests Green)

### 必跑项

- [ ] 单元测试（vitest / jest / pytest）
- [ ] 集成测试（API 端到端）
- [ ] E2E 测试（Playwright / Cypress）
- [ ] Linter（biome / eslint）
- [ ] Type check（tsc --noEmit）
- [ ] 测试覆盖率（按 spec 要求）

### 失败动作

- ❌ 测试失败 → 必返回失败列表 + 行号
- ❌ 覆盖率不达标 → 必返回缺口模块

## Step 2: 评审通过 (Review Passed)

### 必查项

- [ ] `review.md` 存在
- [ ] `review.md` frontmatter `status` = `PASS`
- [ ] P0 = 0
- [ ] P1 = 0 或全部豁免（含理由 + 豁免人）

### 失败动作

- ❌ review 缺失 → 必走 `eas-dev-review`
- ❌ P0 > 0 → 必修复后重审
- ❌ P1 未豁免 → 必修复或显式豁免

## Step 3: 文档同步 (Docs Synced)

### 必改项

| 变更类型 | 必改文档 |
|---|---|
| 新增 API 端点 | README + API 文档 |
| 修改 API 行为 | README + API 文档 + CHANGELOG |
| 新增配置项 | README + 配置文档 |
| 架构变更 | ARCHITECTURE.md + ADR |
| 性能优化 | CHANGELOG（含指标） |
| Bug 修复 | CHANGELOG（如用户可见） |

### 验证

- [ ] 所有新增的公共 API 在文档中
- [ ] 所有修改的 API 行为描述更新
- [ ] CHANGELOG 追加（如有变更）
- [ ] 过期注释 / 文档清理

### 失败动作

- ❌ 文档缺失 → 必返回缺失文档路径 + 应改章节

## Step 4: PR 创建 (PR Created)

### PR 描述模板

```markdown
## 概述

<一句话描述本次变更>

## Spec 链接

[spec.md](path/to/spec.md)

## Review 链接

[review.md](path/to/review.md)（status: PASS）

## 测试计划

- [ ] 单元测试：<N> 个用例，覆盖率 <X>%
- [ ] 集成测试：<场景>
- [ ] E2E 测试：<场景>

## 验收摘要

| AC ID | 状态 | 备注 |
|---|---|---|
| AC-1 | ✅ | <说明> |
| AC-2 | ✅ | <说明> |

## 截图 / 录屏

<如有 UI 变更>

## 风险与回滚

<风险评估 + 回滚方案>
```

### 验证

- [ ] spec 链接存在
- [ ] review 链接存在 + status = PASS
- [ ] 测试计划含 3 类测试
- [ ] 验收摘要含 ≥1 AC

## Step 5: Merge 决策 (Merge Decision)

### 可选 merge 策略

| 策略 | 适用场景 |
|---|---|
| **merge commit** | 保留完整历史；多人协作 |
| **squash merge** | 单一 commit；个人 / 小团队 |
| **rebase merge** | 线性历史；项目要求 |

### 必询问项

- [ ] merge 策略
- [ ] 是否需要 code owner review
- [ ] 是否删除 feature branch
- [ ] 是否需要 CI 强制通过

### 失败动作

- ❌ 未询问用户 → 必报错

## Step 6: 部署 (Deploy)

### 部署前检查

- [ ] CI 全绿
- [ ] 部署密钥 / 配置就绪
- [ ] 数据库迁移（如有）

### 部署后验证

- [ ] Smoke test 通过（健康检查 + 关键端点）
- [ ] 日志无异常
- [ ] 监控指标正常

### 回滚方案

- [ ] 上次 commit 可快速回滚
- [ ] 部署脚本支持一键回滚
- [ ] 数据库迁移有 backward compatible

### 失败动作

- ❌ CI 失败 → 必停止部署；返回失败原因
- ❌ 部署失败 → 必立即回滚；记录原因
- ❌ smoke test 失败 → 必立即回滚

## Step 7: 通知 (Notify)

### 必通知对象

| 对象 | 通知内容 |
|---|---|
| 团队群（Slack / 飞书） | 变更摘要 + PR 链接 + 部署状态 |
| 客户（如有用户可见变更） | 新功能 / 修复摘要 |
| 监控值班 | 上线时间 + 影响范围 + 回滚方案 |

### 通知模板

```
[新功能/修复上线]
- 摘要：<一句话>
- 变更范围：<模块>
- 影响：<用户/系统影响>
- PR：<URL>
- 部署：<时间 + 环境>
- 回滚：<方案>
- 监控：<关键指标>
```

### 验证

- [ ] 通知消息已发送
- [ ] 相关方收到
- [ ] 监控值班知晓

## 完整流程图

```
[Step 1: tests-green]
  ↓ ✅
[Step 2: review-passed]
  ↓ ✅
[Step 3: docs-synced]
  ↓ ✅
[Step 4: pr-created]
  ↓ ✅
[Step 5: merge-decision] ← 询问用户
  ↓ 用户决策
[Step 6: deploy] ← CI / smoke test
  ↓ ✅
[Step 7: notify]
  ↓ ✅
[Complete]
```

---

**最后更新**：2026-08-08