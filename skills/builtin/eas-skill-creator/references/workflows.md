# 工作流程 (Workflows)

## 技能创建流程 (Skill Creation Process)

```
了解需求 → 确定模式 → 初始化结构 → 填充内容 → 验证 → 打包 → 迭代
```

### 步骤 1：了解需求 (Understand Requirements)

通过具体示例理解技能的使用场景。

### 步骤 2：确定模式 (Determine Mode)

根据需求选择合适的模式（参考 [skill-spec.md](skill-spec.md)）。

### 步骤 3：初始化结构 (Initialize Structure)

```bash
tsx scripts/init-skill.ts <skill-name> --path ./skills --resources scripts,references,assets --examples
```

### 步骤 4：填充内容 (Fill Content)

根据模式填充 SKILL.md 和资源文件。

### 步骤 5：验证 (Validate)

```bash
tsx scripts/quick-validate.ts ./skills/<skill-name>
```

### 步骤 6：打包 (Package)

```bash
tsx scripts/package-skill.ts ./skills/<skill-name>
```

---

## 模式特定流程 (Mode-Specific Process)

### Tool Wrapper 流程 (Tool Wrapper Process)

1. 补充 API 速查表
2. 添加调用示例
3. 编写常见错误表

### Generator 流程 (Generator Process)

1. 定义输出模板
2. 编写校验规则
3. 定义失败处理

### Reviewer 流程 (Reviewer Process)

1. 编写审查流程（entry → steps → exit）
2. 创建 `references/checklist.md`
3. 定义输出格式

### Inversion 流程 (Inversion Process)

1. 设计澄清阶段（≤3 阶段）
2. 编写问题（≤5 必答，每题 2~4 选项）
3. 设置 `refuseActionWhenIncomplete: true`

### Pipeline 流程 (Pipeline Process)

1. 定义步骤序列
2. 每步设置 Gate 三要素
3. 声明依赖关系

---

## 验证流程 (Validation Process)

### 基础验证 (Basic Validation)

1. 检查 SKILL.md 存在
2. 验证 YAML frontmatter 格式
3. 检查 name 和 description 必填

### 模式验证 (Mode Validation)

1. 检查 mode 字段有效
2. 验证模式特定字段
3. 检查组合模式结构

---

## 迭代流程 (Iteration Process)

1. 在实际任务中使用技能
2. 记录问题或低效之处
3. 更新 SKILL.md 或资源
4. 重新验证和打包
