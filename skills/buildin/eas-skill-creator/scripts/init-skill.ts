#!/usr/bin/env tsx
/**
 * easbot 技能初始化脚本 (类似 init_skill.py)
 * 用于创建和初始化新的AI Agent技能项目
 */

import { promises as fsPromises } from 'fs';
import * as path from 'path';

const MAX_SKILL_NAME_LENGTH = 64;
const ALLOWED_RESOURCES = new Set(['scripts', 'references', 'assets']);

// Function to load the skill template from external file
async function loadSkillTemplate(): Promise<string> {
  const templatePath = path.join(__dirname, 'skill-template.txt');
  try {
    return await fsPromises.readFile(templatePath, 'utf-8');
  } catch (error: any) {
    console.error(`Error reading skill template: ${error.message}`);
    // Fallback template in case file reading fails
    return `---
name: {skill_name}
description: 该技能应在[在这里描述使用场景和触发条件]时使用，[在这里描述技能的主要功能]。
category: [在这里填写类别，如builtin, development, tool等]
version: 1.0.0
tags: [easbot, skill, {skill_name}]
---

# {skill_title} - [在这里填写中文标题] ([English Title])

## 概述 (Overview)

[在这里简明扼要地说明技能用途，1-2句话描述该技能提供的能力]

## 何时使用 (When to Use)

该技能应在以下情况使用：
- [具体触发条件1]
- [具体触发条件2]
- [具体触发条件3]

## 快速参考 (Quick Reference)

- [简要列出关键要点或使用方法]

## [在这里添加主要内容部分]

[在这里添加具体内容，根据需要可以是:]
- 核心模式 (Core Pattern) - 适用于技术或模式类技能
- 实现 (Implementation) - 代码示例和具体实现
- 命令和工具 (Commands and Tools) - 可用的命令行工具
- 与其他技能的关系 (Relationships with Other Skills) - 与其他技能的交互

## 参考资料 (References)

如需更详细的参考资料，请参见 [references/](./references/) 目录下的相关文档。

[注：上面的模板遵循EASBot技能创建规范，包含了必需的部分和可选部分，同时保持简洁性。]
`;
  }
}

const EXAMPLE_SCRIPT = `#!/usr/bin/env tsx
/**
 * Example helper script for {skill_name}
 *
 * This is a placeholder script that can be executed directly with tsx.
 * Replace with actual implementation or delete if not needed.
 *
 * Example real scripts from other skills:
 * - pdf/scripts/fill_fillable_fields.ts - Fills PDF form fields
 * - pdf/scripts/convert_pdf_to_images.ts - Converts PDF pages to images
 */

async function main() {
    console.log("This is an example script for {skill_name}");
    // TODO: Add actual script logic here
    // This could be data processing, file conversion, API calls, etc.

    // Example async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log("Script completed successfully!");
}

// Execute main function if this file is run directly
if (typeof require !== 'undefined' && require.main === module) {
    main().catch(error => {
        console.error('Error running script:', error);
        process.exit(1);
    });
}

export { main };`;

const EXAMPLE_REFERENCE = `# Reference Documentation for {skill_title}

This is a placeholder for detailed reference documentation.
Replace with actual reference content or delete if not needed.

Example real reference docs from other skills:
- product-management/references/communication.md - Comprehensive guide for status updates
- product-management/references/context_building.md - Deep-dive on gathering context
- bigquery/references/ - API references and query examples

## When Reference Docs Are Useful

Reference docs are ideal for:
- Comprehensive API documentation
- Detailed workflow guides
- Complex multi-step processes
- Information too lengthy for main SKILL.md
- Content that's only needed for specific use cases

## Structure Suggestions

### API Reference Example
- Overview
- Authentication
- Endpoints with examples
- Error codes
- Rate limits

### Workflow Guide Example
- Prerequisites
- Step-by-step instructions
- Common patterns
- Troubleshooting
- Best practices`;

const EXAMPLE_ASSET = `# Example Asset File

This placeholder represents where asset files would be stored.
Replace with actual asset files (templates, images, fonts, etc.) or delete if not needed.

Asset files are NOT intended to be loaded into context, but rather used within
the output Agent produces.

Example asset files from other skills:
- Brand guidelines: logo.png, slides_template.pptx
- Frontend builder: hello-world/ directory with HTML/React boilerplate
- Typography: custom-font.ttf, font-family.woff2
- Data: sample_data.csv, test_dataset.json

## Common Asset Types

- Templates: .pptx, .docx, boilerplate directories
- Images: .png, .jpg, .svg, .gif
- Fonts: .tff, .otf, .woff, .woff2
- Boilerplate code: Project directories, starter files
- Icons: .ico, .svg
- Data files: .csv, .json, .xml, .yaml

Note: This is a text placeholder. Actual assets can be any file type.`;

function normalizeSkillName(skillName: string): string {
  // Normalize a skill name to lowercase hyphen-case
  let normalized = skillName.trim().toLowerCase();
  normalized = normalized.replace(/[^a-z0-9]+/g, '-');
  normalized = normalized.replace(/^-|-$/g, '');
  normalized = normalized.replace(/-{2,}/g, '-');
  return normalized;
}

function titleCaseSkillName(skillName: string): string {
  // Convert hyphenated skill name to Title Case for display
  return skillName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function parseResources(rawResources: string | undefined): string[] {
  if (!rawResources) {
    return [];
  }
  const resources = rawResources
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item);

  const invalid = resources.filter((item) => !ALLOWED_RESOURCES.has(item)).sort();
  if (invalid.length > 0) {
    const allowed = Array.from(ALLOWED_RESOURCES).sort().join(', ');
    console.error(`[ERROR] Unknown resource type(s): ${invalid.join(', ')}`);
    console.error(`   Allowed: ${allowed}`);
    process.exit(1);
  }

  // Remove duplicates while preserving order
  const seen = new Set();
  return resources.filter((resource) => {
    if (seen.has(resource)) {
      return false;
    }
    seen.add(resource);
    return true;
  });
}

// 创建目录，支持递归创建
async function ensureDir(dirPath: string): Promise<void> {
  await fsPromises.mkdir(dirPath, { recursive: true });
}

async function createResourceDirs(skillDir: string, skillName: string, skillTitle: string, resources: string[], includeExamples: boolean): Promise<void> {
  for (const resource of resources) {
    const resourceDir = path.join(skillDir, resource);

    // 使用原生 fs 方法确保目录存在
    await ensureDir(resourceDir);

    if (resource === 'scripts') {
      if (includeExamples) {
        const exampleScript = path.join(resourceDir, 'example.ts');
        await fsPromises.writeFile(exampleScript, EXAMPLE_SCRIPT.replace('{skill_name}', skillName));
        console.log('[OK] Created scripts/example.ts');
      } else {
        console.log('[OK] Created scripts/');
      }
    } else if (resource === 'references') {
      if (includeExamples) {
        const exampleReference = path.join(resourceDir, 'api_reference.md');
        await fsPromises.writeFile(exampleReference, EXAMPLE_REFERENCE.replace('{skill_title}', skillTitle));
        console.log('[OK] Created references/api_reference.md');
      } else {
        console.log('[OK] Created references/');
      }
    } else if (resource === 'assets') {
      if (includeExamples) {
        const exampleAsset = path.join(resourceDir, 'example_asset.txt');
        await fsPromises.writeFile(exampleAsset, EXAMPLE_ASSET);
        console.log('[OK] Created assets/example_asset.txt');
      } else {
        console.log('[OK] Created assets/');
      }
    }
  }
}

export async function initSkill(skillName: string, destPath: string, resources: string[], includeExamples: boolean): Promise<string | null> {
  /*
  Initialize a new skill directory with template SKILL.md.

  Args:
    skillName: Name of the skill
    destPath: Path where the skill directory should be created
    resources: Resource directories to create
    includeExamples: Whether to create example files in resource directories

  Returns:
    Path to created skill directory, or null if error
  */
  // Determine skill directory path
  const skillDir = path.join(path.resolve(destPath), skillName);

  // Check if directory already exists
  let dirExists = false;
  try {
    await fsPromises.access(skillDir);
    dirExists = true;
  } catch {
    dirExists = false;
  }

  if (dirExists) {
    console.error(`[ERROR] Skill directory already exists: ${skillDir}`);
    return null;
  }

  // Create skill directory
  try {
    await ensureDir(skillDir);
    console.log(`[OK] Created skill directory: ${skillDir}`);
  } catch (e: any) {
    console.error(`[ERROR] Error creating directory: ${e.message || e}`);
    return null;
  }

  // Load SKILL template
  const skillTemplate = await loadSkillTemplate();

  // Create SKILL.md from template
  const skillTitle = titleCaseSkillName(skillName);
  const skillContent = skillTemplate.replace('{skill_name}', skillName).replace('{skill_title}', skillTitle);

  const skillMdPath = path.join(skillDir, 'SKILL.md');
  try {
    await fsPromises.writeFile(skillMdPath, skillContent);
    console.log('[OK] Created SKILL.md');
  } catch (e: any) {
    console.error(`[ERROR] Error creating SKILL.md: ${e.message || e}`);
    return null;
  }

  // Create resource directories if requested
  if (resources.length > 0) {
    try {
      await createResourceDirs(skillDir, skillName, skillTitle, resources, includeExamples);
    } catch (e: any) {
      console.error(`[ERROR] Error creating resource directories: ${e.message || e}`);
      return null;
    }
  }

  // Print next steps
  console.log(`\n[OK] Skill '${skillName}' initialized successfully at ${skillDir}`);
  console.log('\nNext steps:');
  console.log('1. Edit SKILL.md to complete the TODO items and update the description');
  if (resources.length > 0) {
    if (includeExamples) {
      console.log('2. Customize or delete the example files in scripts/, references/, and assets/');
    } else {
      console.log('2. Add resources to scripts/, references/, and assets/ as needed');
    }
  } else {
    console.log('2. Create resource directories only if needed (scripts/, references/, assets/)');
  }
  console.log('3. Run the validator when ready to check the skill structure');

  return skillDir;
}

// Main function to run when this script is executed directly
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: tsx init-skill.ts <skill-name> --path <path> [--resources scripts,references,assets] [--examples]');
    console.log('');
    console.log('Examples:');
    console.log('  tsx init-skill.ts my-new-skill --path skills/public');
    console.log('  tsx init-skill.ts my-new-skill --path skills/public --resources scripts,references');
    console.log('  tsx init-skill.ts my-api-helper --path skills/private --resources scripts --examples');
    console.log('  tsx init-skill.ts custom-skill --path /custom/location');
    return;
  }

  // Parse arguments manually
  let skillName = args[0];
  let destPath = '';
  let resourcesStr = '';
  let includeExamples = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--path' && i + 1 < args.length) {
      destPath = args[i + 1];
      i++;
    } else if (args[i] === '--resources' && i + 1 < args.length) {
      resourcesStr = args[i + 1];
      i++;
    } else if (args[i] === '--examples') {
      includeExamples = true;
    } else if (args[i].startsWith('-')) {
      console.error(`[ERROR] Unknown argument: ${args[i]}`);
      process.exit(1);
    }
  }

  if (!destPath) {
    console.error('[ERROR] Missing required argument --path');
    process.exit(1);
  }

  // Validate examples arg requirement
  if (includeExamples && !resourcesStr) {
    console.error('[ERROR] --examples requires --resources to be set.');
    process.exit(1);
  }

  const rawSkillName = skillName;
  skillName = normalizeSkillName(rawSkillName);

  if (!skillName) {
    console.error('[ERROR] Skill name must include at least one letter or digit.');
    process.exit(1);
  }

  if (skillName.length > MAX_SKILL_NAME_LENGTH) {
    console.error(`[ERROR] Skill name '${skillName}' is too long (${skillName.length} characters). ` + `Maximum is ${MAX_SKILL_NAME_LENGTH} characters.`);
    process.exit(1);
  }

  if (skillName !== rawSkillName) {
    console.log(`Note: Normalized skill name from '${rawSkillName}' to '${skillName}'.`);
  }

  const resources = parseResources(resourcesStr);

  console.log(`Initializing skill: ${skillName}`);
  console.log(`   Location: ${destPath}`);
  if (resources.length > 0) {
    console.log(`   Resources: ${resources.join(', ')}`);
    if (includeExamples) {
      console.log('   Examples: enabled');
    }
  } else {
    console.log('   Resources: none (create as needed)');
  }
  console.log();

  const result = await initSkill(skillName, destPath, resources, includeExamples);

  if (result) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// 检查当前脚本是否作为主模块运行
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 只有在直接运行脚本时才执行 main 函数
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default initSkill;
