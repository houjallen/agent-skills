#!/usr/bin/env tsx
/**
 * easbot 技能验证脚本 (类似 quick_validate.py)
 * 用于验证AI Agent技能项目是否符合规范
 */

import * as yaml from 'js-yaml';
import { promises as fs } from 'fs';
import * as path from 'path';

const MAX_SKILL_NAME_LENGTH = 64;

// 辅助函数检查文件是否存在
async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export class SkillValidator {
  /**
   * 验证技能（类似 quick_validate.py 功能）
   */
  async validateSkill(skillPath: string): Promise<{ valid: boolean; message: string; details?: any }> {
    try {
      const skillPathObj = path.resolve(skillPath);
      const skillMdPath = path.join(skillPathObj, 'SKILL.md');

      // 检查 SKILL.md 是否存在
      if (!(await pathExists(skillMdPath))) {
        return { valid: false, message: 'SKILL.md not found' };
      }

      const content = await fs.readFile(skillMdPath, 'utf8');

      // 检查 YAML frontmatter
      if (!content.startsWith('---')) {
        return { valid: false, message: 'No YAML frontmatter found' };
      }

      // 提取 frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        return { valid: false, message: 'Invalid frontmatter format' };
      }

      const frontmatterText = frontmatterMatch[1];

      // 解析YAML
      let frontmatter: any;
      try {
        frontmatter = yaml.load(frontmatterText) as any;
        if (typeof frontmatter !== 'object' || frontmatter === null) {
          return { valid: false, message: 'Frontmatter must be a YAML dictionary' };
        }
      } catch (error) {
        return { valid: false, message: `Invalid YAML in frontmatter: ${(error as Error).message}` };
      }

      // 检查不允许的属性
      const allowedProperties = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata', 'category', 'version', 'tags']);
      const unexpectedKeys = Object.keys(frontmatter).filter((key) => !allowedProperties.has(key));

      if (unexpectedKeys.length > 0) {
        const allowed = Array.from(allowedProperties).sort().join(', ');
        const unexpected = unexpectedKeys.sort().join(', ');
        return {
          valid: false,
          message: `Unexpected key(s) in SKILL.md frontmatter: ${unexpected}. Allowed properties are: ${allowed}`,
        };
      }

      if (!Object.hasOwn(frontmatter, 'name')) {
        return { valid: false, message: "Missing 'name' in frontmatter" };
      }
      if (!Object.hasOwn(frontmatter, 'description')) {
        return { valid: false, message: "Missing 'description' in frontmatter" };
      }

      // 验证名称
      let name = frontmatter.name;
      if (typeof name !== 'string') {
        return { valid: false, message: `Name must be a string, got ${typeof name}` };
      }
      name = name.trim();
      if (name) {
        if (!/^[a-z0-9-]+$/.test(name)) {
          return { valid: false, message: `Name '${name}' should be hyphen-case (lowercase letters, digits, and hyphens only)` };
        }
        if (name.startsWith('-') || name.endsWith('-') || name.includes('--')) {
          return { valid: false, message: `Name '${name}' cannot start/end with hyphen or contain consecutive hyphens` };
        }
        if (name.length > MAX_SKILL_NAME_LENGTH) {
          return { valid: false, message: `Name is too long (${name.length} characters). Maximum is ${MAX_SKILL_NAME_LENGTH} characters.` };
        }
      }

      // 验证描述
      let description = frontmatter.description;
      if (typeof description !== 'string') {
        return { valid: false, message: `Description must be a string, got ${typeof description}` };
      }
      description = description.trim();
      if (description) {
        if (description.includes('<') || description.includes('>')) {
          return { valid: false, message: 'Description cannot contain angle brackets (< or >)' };
        }
        if (description.length > 1024) {
          return { valid: false, message: `Description is too long (${description.length} characters). Maximum is 1024 characters.` };
        }
      }

      return { valid: true, message: 'Skill is valid!' };
    } catch (error: any) {
      return { valid: false, message: `Error validating skill: ` + error.message };
    }
  }

  /**
   * 完整验证技能（包含目录结构验证）
   */
  async validateSkillComplete(skillPath: string): Promise<{ valid: boolean; message: string; details?: any }> {
    try {
      // 首先运行基本验证
      const basicValidation = await this.validateSkill(skillPath);
      if (!basicValidation.valid) {
        return basicValidation;
      }

      // 验证标准目录结构
      const requiredDirs = ['scripts', 'references', 'assets'];
      const dirStatus: Record<string, any> = {};

      for (const dir of requiredDirs) {
        const dirPath = path.join(skillPath, dir);
        const exists = await pathExists(dirPath);
        dirStatus[dir] = exists;
      }

      // 检查 SKILL.md 文件大小和内容质量
      const skillMdPath = path.join(skillPath, 'SKILL.md');
      const content = await fs.readFile(skillMdPath, 'utf8');

      // 检查是否包含 TODO 或占位符内容
      const hasPlaceholders = content.includes('[TODO:') || content.includes('TODO') || content.includes('placeholder');

      const details = {
        directories: dirStatus,
        hasPlaceholders: hasPlaceholders,
        contentLength: content.length,
      };

      if (hasPlaceholders) {
        return {
          valid: false,
          message: "Skill contains placeholder content ([TODO:] or 'placeholder'). Please update with actual content.",
          details: details,
        };
      }

      // 检查是否有足够的内容
      if (content.length < 100) {
        console.log('⚠️  Warning: SKILL.md content is quite short. Consider adding more detailed documentation.');
      }

      return {
        valid: true,
        message: 'Skill is fully valid with proper structure and content!',
        details: details,
      };
    } catch (error: any) {
      return {
        valid: false,
        message: `Error performing complete skill validation: ` + error.message,
      };
    }
  }
}

// 主函数，当直接运行此脚本时执行
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: tsx quick-validate.ts <skill-path> [--complete]');
    console.log('Example: tsx quick-validate.ts ./skills/my-skill');
    console.log('Example: tsx quick-validate.ts ./skills/my-skill --complete');
    return;
  }

  const skillPath = args[0];
  const complete = args.includes('--complete');

  const validator = new SkillValidator();

  try {
    let result;
    if (complete) {
      console.log('Performing complete validation...');
      result = await validator.validateSkillComplete(skillPath);
    } else {
      console.log('Performing basic validation...');
      result = await validator.validateSkill(skillPath);
    }

    if (result.valid) {
      console.log('✅', result.message);
      if (result.details) {
        console.log('Details:', result.details);
      }
      process.exit(0);
    } else {
      console.log('❌', result.message);
      if (result.details) {
        console.log('Details:', result.details);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('Error validating skill:', error.message);
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

export default new SkillValidator();
