# Skill Spec 规范 (Skill Specification)

## 概述 (Overview)

本文档定义 EASBot Skill 的完整类型规范，包括模式选择、字段约束和工程化结构。

## 1. 核心理论框架

### 1.1 竞争焦点迁移

竞争焦点正从「提示词」转向「标准资产」。可安装、可组合、可迁移的 Skill 才是真正的壁垒。

### 1.2 可组合模块是核心价值

一个 Skill 往往会混合 2~3 种模式：按需加载、跨工具流通、可组合。

### 1.3 任务的两个分水岭

| 分组 | 模式 | 角色 |
|---|---|---|
| **内容侧** | Tool Wrapper、Generator | 补知识、稳输出——给模型"补课" |
| **分水岭** | — | 不再是"内容"，而是"行动方式" |
| **行动侧** | Reviewer、Inversion、Pipeline | 控行为、管流程——给模型"加锁" |

## 2. 五种模式详解

| # | 模式 | 一句话定义 | 典型场景 |
|---|---|---|---|
| 1 | **Tool Wrapper** | 给模型补某个库的专家知识 | 补 API/库/工具的最新用法 |
| 2 | **Generator** | 按固定模板/格式稳定输出 | 报表生成、Schema 化输出、代码脚手架 |
| 3 | **Reviewer** | 按标准清单逐项核查 | 代码评审、合规审查、Pre-PR 检查 |
| 4 | **Inversion** | 先问清楚：反向澄清需求 | 模糊需求澄清、关键参数反问 |
| 5 | **Pipeline** | 不能跳步：流程化多步串联 | 部署流水线、数据 ETL、多阶段审查 |

## 3. SkillSpec 类型定义

```typescript
export type SkillMode =
  | 'tool-wrapper'   // 补知识
  | 'generator'      // 稳输出
  | 'reviewer'       // 按标准审
  | 'inversion'      // 先问再做
  | 'pipeline';      // 每步过 Gate

export type Composition = 'single' | 'composed';

export interface SkillSpec {
  // ── 基础字段 ──────────────────────────
  name: string;
  description: string;
  scope?: string;
  body: string;
  frontmatter?: Record<string, unknown>;
  origin: { kind: 'created' | 'evolved'; fromSpecId?: string; experienceIds?: string[] };
  createdAt: ISOTimestamp;

  // ── 模式字段 ──────────────────────────
  mode: SkillMode;
  secondaryModes?: SkillMode[];
  composition: Composition;
  compositionConnections?: Array<{
    from: SkillMode;
    to: SkillMode;
    kind: 'embed' | 'sequence' | 'gate';
  }>;

  // ── 交付完整性自检 ──────────────────────────
  deliveryChecklist: {
    developmentGuide: boolean;
    pitfallTable: boolean;
    reviewProcess: boolean;
    deploymentGuide: boolean;
    observability: boolean;
    scripts: boolean;
  };

  // ── 可迁移性 ──────────────────────────
  portability?: {
    platforms: string[];
    tools: string[];
  };

  // ── Reviewer 模式专属 ──────────────────────────
  reviewer?: ReviewerSpec;

  // ── 行为强约束 ──────────────────────────
  behavior?: BehaviorSpec;
}
```

## 4. ReviewerSpec 定义

```typescript
export interface ReviewerSpec {
  checklist: {
    filePath: string;
    itemCount?: number;
    severityLevels: string[];
    scoringRubric?: string;
  };
  process: {
    entry: string;
    steps: Array<{
      id: string;
      name: string;
      checklistSection?: string;
    }>;
    exit: string;
  };
}
```

## 5. BehaviorSpec 定义

```typescript
export interface BehaviorSpec {
  gate?: InversionGateSpec;
  sequence?: PipelineSequenceSpec;
}

export interface InversionGateSpec {
  phases: Array<{
    id: string;
    name: string;
    questions: Array<{
      id: string;
      question: string;
      options: Array<{ value: string; label: string; description?: string }>;
      required: boolean;
    }>;
    exitGate: {
      allRequiredAnswered?: boolean;
      minPhaseCompleteness?: number;
    };
  }>;
  refuseActionWhenIncomplete: boolean;
}

export interface PipelineSequenceSpec {
  steps: Array<{
    id: string;
    name: string;
    kind: 'parse' | 'transform' | 'analyze' | 'generate' | 'review' | 'deploy';
    dependsOn?: string[];
    reviewer?: {
      skillName: string;
      checklistSection?: string;
      onReviewFail: 'abort' | 'warn-continue' | 'human-review';
    };
    gate: {
      entryConditions: Array<{ type: string; check?: string }>;
      exitConditions: Array<{ type: string; metric?: { name: string; op: string; value: number } }>;
      onFailure: { action: 'abort' | 'skip' | 'retry'; maxRetries?: number; rollback?: boolean; notifyHuman?: boolean };
    };
  }>;
  policy?: { strictMode?: boolean; rollbackOnAbort?: boolean };
}
```

## 6. 模式识别关键词

| 模式 | 关键词信号 |
|---|---|
| **Tool Wrapper** | 「怎么用」「API」「库」「版本」「最新」「语法」「调用」 |
| **Generator** | 「生成」「输出」「模板」「固定」「结构」「格式」「报表」 |
| **Reviewer** | 「审查」「评审」「检查」「合规」「对照」「清单」「verify」 |
| **Inversion** | 「先问」「澄清」「确认」「需求」「参数」「歧义」「前置」 |
| **Pipeline** | 「按顺序」「先 X 后 Y」「流程」「步骤」「pipeline」「不能跳」 |
