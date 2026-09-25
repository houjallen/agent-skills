# 两轴评审详细 Checklist (Review Checklist)

> **所属技能**：`eas-dev-review`
> **目标**：提供完整的两轴评审 checklist，按 P0/P1/P2 分类

---

## 轴 1：标准轴 (Standards)

### 安全 (Security) — P0

- [ ] 无 SQL 注入（参数化查询）
- [ ] 无 XSS（HTML 转义）
- [ ] 无 CSRF 漏洞
- [ ] 无硬编码密钥 / API key
- [ ] 用户输入已验证
- [ ] 敏感数据已加密（at-rest + in-transit）

### 错误处理 (Error Handling) — P1

- [ ] 异常已被捕获 / 处理（不静默吞掉）
- [ ] 错误信息不泄漏敏感数据（栈追踪 / SQL / 内部路径）
- [ ] 错误信息含可操作信息（用户能做什么）
- [ ] 错误日志含足够上下文（trace_id / user_id）
- [ ] 外部 API 调用有 timeout / retry / circuit-breaker

### 性能 (Performance) — P1

- [ ] 无 N+1 查询
- [ ] 无 O(n²) 算法（除非有注释 + 性能测试验证）
- [ ] 大数据集使用流式处理 / 分页
- [ ] 无内存泄漏（资源正确释放）
- [ ] 数据库索引已加（按 spec 中高频查询字段）

### 命名 (Naming) — P1

- [ ] 命名与项目风格一致（驼峰 / snake_case）
- [ ] 无缩写（除非行业通用如 `id` / `url`）
- [ ] 函数名描述动作（动词）
- [ ] 变量名描述内容（名词）
- [ ] 类型名描述概念（名词）

### 风格 (Style) — P2

- [ ] 通过 linter（biome / eslint）
- [ ] 通过 formatter（prettier）
- [ ] import 顺序正确
- [ ] 注释简洁（不解释 what，解释 why）

### 可读性 (Readability) — P2

- [ ] 函数 ≤ 50 行
- [ ] 嵌套 ≤ 4 层
- [ ] 复杂逻辑有注释
- [ ] magic number 替换为命名常量

## 轴 2：spec 轴 (Spec Compliance)

### 接口契约 (Interface Contract) — P0

- [ ] 与 spec.md §3 接口定义一致（方法签名 / 参数类型 / 返回值）
- [ ] 与 spec.md §3 错误码一致
- [ ] 无新增接口（除非 spec 变更）
- [ ] 无删除接口（除非 spec 变更）

### 验收覆盖 (Acceptance Coverage) — P0

- [ ] 所有 spec.md §4 acceptance_criteria.primary 已实现
- [ ] 每个 AC 含验证方式（单元测试 / 集成测试 / 手动步骤）
- [ ] spec.md §4 acceptance_criteria.secondary 已实现或显式豁免

### 范围守纪 (Scope Discipline) — P0

- [ ] 未做 spec.md §5 out_of_scope 任何项
- [ ] 未引入 spec 中未提及的依赖
- [ ] 未修改 spec 范围外的文件

### 设计遵循 (Design Compliance) — P1

- [ ] 模块边界符合 design.md §1 模块图
- [ ] 接口面积符合 design.md §3 契约
- [ ] 数据流符合 design.md §4
- [ ] 测试策略符合 design.md §5

### 文档同步 (Documentation Sync) — P2

- [ ] README 更新（如接口变更）
- [ ] API 文档更新
- [ ] CHANGELOG 追加（如有用户可见变更）
- [ ] 注释中的"过期信息"已清理

### 测试覆盖 (Test Coverage) — P1

- [ ] 核心逻辑单测覆盖率 ≥ spec 指定值
- [ ] 边界情况有测试（空 / null / 极端值）
- [ ] 错误路径有测试（异常 / 边界）
- [ ] E2E 测试覆盖关键用户流程（如 spec §4 含此要求）

---

## 整体流程 (Full Process)

```
1. 读 diff
2. 读 spec.md / design.md（spec 轴必需）
3. 读项目风格指南（标准轴参考）
4. 逐项过标准轴 checklist → 标注 P0/P1/P2
5. 逐项过 spec 轴 checklist → 标注 P0/P1/P2
6. 汇总：P0 计数 / P1 计数 / P2 计数
7. 输出 review.md（模板见 assets/）
8. 判定：
   - P0 > 0 → FAIL（阻止合入）
   - P1 > 0 → 有条件 PASS（要求修复或豁免）
   - 仅 P2 > 0 → PASS with notes
9. 提交 review.md 给作者
```

---

**最后更新**：2026-08-08
