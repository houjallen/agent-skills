#!/usr/bin/env tsx
// eas-planning-writer 动态初始化脚本 - 创建规划文件

import { promises as fs } from 'fs';
import * as path from 'path';

const DATE = new Date().toISOString().split('T')[0];

interface PlanningFiles {
  taskPlan: string;
  findings: string;
  progress: string;
}

async function readTemplate(templateName: string): Promise<string> {
  /** 从模板目录读取模板文件内容 */
  const templatePath = path.join(__dirname, '..', 'references', 'templates', templateName);
  try {
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    console.error(`警告: 未找到模板文件 ${templatePath}, 使用默认内容`);
    // 如果找不到模板，返回默认内容
    return getDefaultTemplate(templateName);
  }
}

function getDefaultTemplate(templateName: string): string {
  /** 返回默认模板内容 */
  switch (templateName) {
    case 'task_plan.md':
      return `# 任务计划：${DATE}

<!--
  内容：这是你整个任务的路线图。把它想象成你"磁盘上的工作记忆"。
  原因：经过 50 次以上的工具调用后，你最初的目标可能会被遗忘。这个文件让它们保持新鲜。
  时机：首先创建这个，在开始任何工作之前。每个阶段完成后更新。
-->

## 目标 (Goal)
<!--
  内：用一句话清楚地描述你想要实现的目标。
  原因：这是你的北极星。重读它可以让你专注于最终状态。
  示例："Create a Python CLI todo app with add, list, and delete functionality."
-->
[一句话描述最终状态]

## 当前阶段 (Current Phase)
<!--
  内：你当前正在进行的阶段（例如，"阶段 1"，"阶段 3"）。
  原因：快速参考你在任务中的位置。随着进度更新此项。
-->
阶段 1

## 阶段 (Phases)
<!--
  内：将你的任务分解为 3-7 个逻辑阶段。每个阶段都应该是可完成的。
  原因：将工作分解为阶段可以防止不知所措，并使进度可见。
  时机：完成每个阶段后更新状态：pending → in_progress → complete
-->

### 阶段 1：需求与发现 (Requirements & Discovery)
<!--
  内：了解需要什么并收集初始信息。
  原因：在不了解的情况下开始会导致精力浪费。此阶段可以防止这种情况。
-->
- [ ] 理解用户意图
- [ ] 识别约束和需求
- [ ] 将发现记录在 findings.md 中
- **状态 (Status):** in_progress
<!--
  状态值：
  - pending: 尚未开始
  - in_progress: 当前正在进行
  - complete: 已完成此阶段
-->

### 阶段 2：规划与结构 (Planning & Structure)
<!--
  内：决定你将如何处理问题以及你将使用什么结构。
  原因：良好规划可以防止返工。记录决策以便你记住为什么选择它们。
-->
- [ ] 定义技术方案
- [ ] 如果需要，创建项目结构
- [ ] 记录决策及其理由
- **状态 (Status):** pending

### 阶段 3：实现 (Implementation)
<!--
  内：实际构建/创建/编写解决方案。
  原因：这是工作发生的地方。如果需要，分解为更小的子任务。
-->
- [ ] 一步一步执行计划
- [ ] 执行前将代码写入文件
- [ ] 增量测试
- **状态 (Status):** pending

### 阶段 4：测试与验证 (Testing & Verification)
<!--
  内：验证一切工作正常并满足需求。
  原因：尽早发现问题可以节省时间。在 progress.md 中记录测试结果。
-->
- [ ] 验证所有需求已满足
- [ ] 在 progress.md 中记录测试结果
- [ ] 修复发现的任何问题
- **状态 (Status):** pending

### 阶段 5：交付 (Delivery)
<!--
  内：最终审查并移交给用户。
  原因：确保没有遗漏，并且交付物是完整的。
-->
- [ ] 审查所有输出文件
- [ ] 确保交付物完整
- [ ] 交付给用户
- **状态 (Status):** pending

## 关键问题 (Key Questions)
<!--
  内：你在任务期间需要回答的重要问题。
  原因：这些指导你的研究和决策。随做随答。
  示例：
    1. Should tasks persist between sessions? (Yes - need file storage)
    2. What format for storing tasks? (JSON file)
-->
1. [要回答的问题]
2. [要回答的问题]

## 已做决策 (Decisions Made)
<!--
  内：你做出的技术和设计决策，以及背后的理由。
  原因：你会忘记为什么做出选择。这个表格帮助你记住并证明决策的合理性。
  时机：每当你做出重大选择（技术、方法、结构）时更新。
  示例：
    | Use JSON for storage | Simple, human-readable, built-in Python support |
    | argparse with subcommands | Clean CLI: python todo.py add "Buy milk" |
-->
| 决策 (Decision) | 理由 (Rationale) |
|----------|-----------|
|          |           |

## 遏到的错误 (Errors Encountered)
<!--
  内：你遇到的每一个错误，它是第几次尝试，以及你是如何解决它的。
  原因：记录错误可以防止重复相同的错误。这对学习至关重要。
  时机：错误发生时立即添加，即使你很快修复了它。
  示例：
    | FileNotFoundError | 1 | Check if file exists, create empty list if not |
    | JSONDecodeError | 2 | Add empty file handling explicitly |
-->
| 错误 (Error) | 尝试 (Attempt) | 解决方案 (Resolution) |
|-------|---------|------------|
|       | 1       |            |

## 笔记 (Notes)
<!--
  提醒：
  - 随着进度更新阶段状态：pending → in_progress → complete
  - 重大决策前重读此计划（注意力操纵）
  - 记录所有错误 - 它们有助于避免重复
  - 永远不要重复失败的动作 - 改为改变你的方法
-->
- 随着进度更新阶段状态：pending → in_progress → complete
- 重大决策前重读此计划（注意力操纵）
- 记录所有错误 - 它们有助于避免重复
`;

    case 'findings.md':
      return `# 发现与决策 (Findings & Decisions)
<!--
  内：你的任务知识库。存储你所有的发现和决定。
  原因：上下文窗口是有限的。这个文件是你的"外部存储器"——持久且无限。
  时机：在任何发现之后更新，特别是在 2 次查看/浏览器/搜索操作之后（双动作规则）。
-->

## 需求 (Requirements)
<!--
  内：用户要求的细分，分解为具体需求。
  原因：保持需求可见，以免忘记你要构建什么。
  时机：在阶段 1（需求与发现）期间填写。
  示例：
    - 命令行界面
    - 添加任务
    - 列出所有任务
    - 删除任务
    - Python 实现
-->
<!-- 从用户请求中捕获 -->
-

## 研究发现 (Research Findings)
<!--
  内：从网络搜索、文档阅读或探索中获得的关键发现。
  原因：多模态内容（图片、浏览器结果）不会持久保存。立即写下来。
  时机：每进行 2 次查看/浏览器/搜索操作后，更新此部分（双动作规则）。
  示例：
    - Python 的 argparse 模块支持子命令，适合清晰的 CLI 设计
    - JSON 模块可以轻松处理文件持久化
    - 标准模式：python script.py <command> [args]
-->
<!-- 探索过程中的关键发现 -->
-

## 技术决策 (Technical Decisions)
<!--
  内：你做出的架构和实现选择，以及理由。
  原因：你会忘记为什么选择某种技术或方法。这个表格保留了这些知识。
  时机：每当你做出重大的技术选择时更新。
  示例：
    | Use JSON for storage | Simple, human-readable, built-in Python support |
    | argparse with subcommands | Clean CLI: python todo.py add "Buy milk" |
-->
<!-- 做出的决策及其理由 -->
| 决策 (Decision) | 理由 (Rationale) |
|----------|-----------|
|          |           |

## 遏到的问题 (Issues Encountered)
<!--
  内：你遇到的问题以及你是如何解决的。
  原因：类似于 task_plan.md 中的错误，但侧重于更广泛的问题（不仅仅是代码错误）。
  时机：当你遇到阻碍或意外挑战时记录。
  示例：
    | Empty file causes JSONDecodeError | Added explicit empty file check before json.load() |
-->
<!-- 错误及其解决方法 -->
| 问题 (Issue) | 解决方案 (Resolution) |
|-------|------------|
|       |            |

## 资源 (Resources)
<!--
  内：你发现有用的 URL、文件路径、API 参考、文档链接。
  原因：便于以后参考。不要在上下文中丢失重要链接。
  时机：发现有用资源时添加。
  示例：
    - Python argparse docs: https://docs.python.org/3/library/argparse.html
    - Project structure: src/main.py, src/utils.py
-->
<!-- URL、文件路径、API 参考 -->
-

## 视觉/浏览器发现 (Visual/Browser Findings)
<!--
  内：你从查看图像、PDF 或浏览器结果中学到的信息。
  原因：关键 - 视觉/多模态内容不会在上下文中持久保存。必须作为文本捕获。
  时机：在查看图像或浏览器结果后立即进行。不要等待！
  示例：
    - 截图显示登录表单有email和password字段
    - 浏览器显示API返回JSON有"status"和"data"键
-->
<!-- 关键：每 2 次查看/浏览器操作后更新 -->
<!-- 多模态内容必须立即捕获为文本 -->
-

---
<!--
  提醒：双动作规则
  每进行 2 次查看/浏览器/搜索操作后，必须更新此文件。
  这可以防止视觉信息在上下文重置时丢失。
-->
*每进行 2 次查看/浏览器/搜索操作后更新此文件*
*这可以防止视觉信息丢失*
`;

    case 'progress.md':
      return `# 进度日志 (Progress Log)
<!--
  内：你的会话日志 - 按时间顺序记录你做了什么，什么时候做的，发生了什么。
  原因：回答"5个问题重启测试"中的"我做了什么？"。帮助你在中断后恢复工作。
  时机：在完成每个阶段或遇到错误后更新。比 task_plan.md 更详细。
-->

## 会话：${DATE}
<!--
  内：本次工作会话的日期。
  原因：帮助追踪工作发生时间，便于在时间间隔后恢复。
  示例：2026-01-15
-->

### 阶段 1：[标题]
<!--
  内：此阶段采取的行动的详细日志。
  原因：提供已完工作的上下文，使其更容易恢复或调试。
  时机：在你完成阶段工作的过程中更新，或者至少在完成时更新。
-->
- **状态 (Status):** in_progress
- **开始时间 (Started):** [timestamp]
<!--
  状态：与 task_plan.md 相同 (pending, in_progress, complete)
  时间戳：你开始此阶段的时间 (例如 "2026-01-15 10:00")
-->
- 采取的行动 (Actions taken):
  <!--
    内：你执行的具体操作列表。
    示例：
      - Created todo.py with basic structure
      - Implemented add functionality
      - Fixed FileNotFoundError
   -->
  -
- 创建/修改的文件 (Files created/modified):
  <!--
    内：你创建或更改了哪些文件。
    原因：快速参考哪些内容被触及。有助于调试和审查。
    示例：
      - todo.py (created)
      - todos.json (created by app)
      - task_plan.md (updated)
   -->
  -

### 阶段 2：[标题]
<!--
  内：与阶段 1 结构相同，用于下一个阶段。
  原因：为每个阶段保留单独的日志条目，以清晰地追踪进度。
-->
- **状态 (Status):** pending
- 采取的行动 (Actions taken):
  -
- 创建/修改的文件 (Files created/modified):
  -

## 测试结果 (Test Results)
<!--
  内：你运行的测试，预期的，实际发生的。
  原因：记录功能的验证。帮助捕捉回归。
  时机：在你测试功能时更新，特别是在第4阶段（测试与验证）期间。
  示例：
    | Add task | python todo.py add "Buy milk" | Task added | Task added successfully | ✓ |
    | List tasks | python todo.py list | Shows all tasks | Shows all tasks | ✓ |
-->
| 测试 (Test) | 输入 (Input) | 期望 (Expected) | 实际 (Actual) | 状态 (Status) |
|------|-------|----------|--------|--------|
|      |       |          |        |        |

## 错误日志 (Error Log)
<!--
  内：遇到的每个错误的详细日志，包括时间戳和解决尝试。
  原因：比 task_plan.md 的错误表更详细。帮助你从错误中学习。
  时机：错误发生时立即添加，即使你很快修复了它。
  示例：
    | 2026-01-15 10:35 | FileNotFoundError | 1 | Added file existence check |
    | 2026-01-15 10:37 | JSONDecodeError | 2 | Added empty file handling |
-->
<!-- 保留所有错误 - 它们有助于避免重复 -->
| 时间戳 (Timestamp) | 错误 (Error) | 尝试 (Attempt) | 解决方案 (Resolution) |
|-----------|-------|---------|------------|
|           |       | 1       |            |

## 5个问题重启检查 (5-Question Reboot Check)
<!--
  内：五个问题，用于验证你的上下文是否稳固。如果你能回答这些问题，你就在正轨上。
  原因：这是"重启测试"——如果你能回答所有 5 个问题，你可以有效地恢复工作。
  时机：定期更新，特别是在休息或上下文重置后恢复时。

  5个问题：
  1. 我在哪？ → task_plan.md中的当前阶段
  2. 我要去哪？ → 剩余阶段
  3. 目标是什么？ → 计划中的目标声明
  4. 我学到了什么？ → 见findings.md
  5. 我做了什么？ → 见progress.md (此文件)
-->
<!-- 如果你能回答这些，上下文是稳固的 -->
| 问题 (Question) | 答案 (Answer) |
|----------|--------|
| 我在哪？ | 阶段 X |
| 我要去哪？ | 剩余阶段 |
| 目标是什么？ | [目标声明] |
| 我学到了什么？ | 见findings.md |
| 我做了什么？ | 见上文 |

---
<!--
  提醒：
  - 完成每个阶段或遇到错误后更新
  - 详细 - 这是你的"发生了什么"日志
  - 包含时间戳以追踪问题发生时间
-->
*完成每个阶段或遇到错误后更新*
`;

    default:
      return `# ${templateName}\n\n<!-- 模板内容 -->\n`;
  }
}

async function checkFileExists(filePath: string): Promise<boolean> {
  /** 检查文件是否存在 */
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createPlanningFiles(outputDir: string = './docs/task'): Promise<void> {
  /** 创建规划文件 */
  try {
    // 确保输出目录存在
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`✓ 创建目录: ${outputDir}`);

    const files: PlanningFiles = {
      taskPlan: path.join(outputDir, 'task_plan.md'),
      findings: path.join(outputDir, 'findings.md'),
      progress: path.join(outputDir, 'progress.md'),
    };

    // 创建 task_plan.md（如果不存在）
    if (!(await checkFileExists(files.taskPlan))) {
      const templateContent = await readTemplate('task_plan.md');
      await fs.writeFile(files.taskPlan, templateContent);
      console.log('✓ 创建 task_plan.md');
    } else {
      console.log('⚠️  task_plan.md 已存在，跳过');
    }

    // 创建 findings.md（如果不存在）
    if (!(await checkFileExists(files.findings))) {
      const templateContent = await readTemplate('findings.md');
      await fs.writeFile(files.findings, templateContent);
      console.log('✓ 创建 findings.md');
    } else {
      console.log('⚠️  findings.md 已存在，跳过');
    }

    // 创建 progress.md（如果不存在）
    if (!(await checkFileExists(files.progress))) {
      const templateContent = await readTemplate('progress.md');
      await fs.writeFile(files.progress, templateContent);
      console.log('✓ 创建 progress.md');
    } else {
      console.log('⚠️  progress.md 已存在，跳过');
    }

    console.log('\n🎉 规划文件初始化成功！');
    console.log(`📁 文件创建于: ${outputDir}`);
    console.log('📋 文件: task_plan.md, findings.md, progress.md');
    console.log('\n💡 后续步骤:');
    console.log('   1. 更新 task_plan.md 中的特定目标和阶段');
    console.log('   2. 使用 findings.md 记录您的发现和决策');
    console.log('   3. 定期更新 progress.md');
    console.log('   4. 使用 5 个问题重启测试定期检查您的进度');
  } catch (error) {
    console.error('❌ 创建规划文件时出错:', error.message);
    throw error;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let outputDir = './docs/task'; // 默认输出目录

  // 解析命令行参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      if (i + 1 < args.length) {
        outputDir = args[i + 1];
        i++; // 跳过下一个参数
      } else {
        console.error('❌ 错误: --output 需要一个目录路径');
        process.exit(1);
      }
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log('用法: tsx init-planning-session.ts [--output|-o <directory>]');
      console.log('初始化规划文件 (task_plan.md, findings.md, progress.md)');
      console.log('');
      console.log('选项:');
      console.log('  --output, -o <directory>  规划文件的输出目录 (默认: ./docs/task)');
      console.log('  --help, -h               显示此帮助信息');
      process.exit(0);
    }
  }

  console.log(`🚀 在 ${outputDir} 初始化规划会话`);
  await createPlanningFiles(outputDir);
}

// 只有在直接运行此脚本时才执行主函数
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createPlanningFiles, readTemplate, getDefaultTemplate };
