#!/usr/bin/env tsx
/**
 * easbot 技能打包脚本 (使用JSZip库的标准版本)
 * 用于将AI Agent技能项目打包成可分发的.skill文件
 */

import * as yaml from 'js-yaml';
import { promises as fs } from 'fs';
import * as path from 'path';
import JSZip from 'jszip';

const MAX_SKILL_NAME_LENGTH = 64;

export class SkillValidator {
  /**
   * 验证技能（类似 quick_validate.py 功能）
   */
  async validateSkill(skillPath: string): Promise<{ valid: boolean; message: string; details?: any }> {
    try {
      const skillPathObj = path.resolve(skillPath);
      const skillMdPath = path.join(skillPathObj, 'SKILL.md');

      // 检查 SKILL.md 是否存在
      try {
        await fs.access(skillMdPath);
      } catch {
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
}

export class SkillPackager {
  /**
   * 打包技能（使用JSZip库）
   */
  async packageSkill(skillPath: string, outputPath?: string): Promise<{ success: boolean; message: string; zipPath?: string }> {
    try {
      const skillPathObj = path.resolve(skillPath);

      // 检查技能文件夹是否存在
      try {
        await fs.access(skillPathObj);
      } catch {
        return { success: false, message: `Skill folder not found: ${skillPathObj}` };
      }

      const stat = await fs.stat(skillPathObj);
      if (!stat.isDirectory) {
        return { success: false, message: `Path is not a directory: ${skillPathObj}` };
      }

      // 检查SKILL.md是否存在
      const skillMdPath = path.join(skillPathObj, 'SKILL.md');
      try {
        await fs.access(skillMdPath);
      } catch {
        return { success: false, message: `SKILL.md not found in ${skillPathObj}` };
      }

      // 运行验证
      console.log('Validating skill...');
      const validator = new SkillValidator();
      const validation = await validator.validateSkill(skillPathObj);

      if (!validation.valid) {
        return { success: false, message: `Validation failed: ${validation.message}\n   Please fix the validation errors before packaging.` };
      }

      console.log(`✅ ${validation.message}\n`);

      // 确定输出位置
      const skillName = path.basename(skillPathObj);
      let outputDir;

      if (outputPath) {
        outputDir = path.resolve(outputPath);
        await fs.mkdir(outputDir, { recursive: true });
      } else {
        outputDir = process.cwd();
      }

      const skillFilename = path.join(outputDir, `${skillName}.skill.jar`);

      // 创建 .skill 文件 (ZIP 格式)
      try {
        console.log('Creating .skill file...');

        const zip = new JSZip();

        // 递归添加所有文件
        const addToZip = async (dir: string, basePath: string = '') => {
          const dirents = await fs.readdir(dir, { withFileTypes: true });
          for (const dirent of dirents) {
            const fullPath = path.join(dir, dirent.name);
            const relPath = path.join(basePath, dirent.name).replace(/\\/g, '/'); // 确保使用正斜杠

            if (dirent.isDirectory()) {
              await addToZip(fullPath, relPath);
            } else {
              const content = await fs.readFile(fullPath);
              zip.file(relPath, content);
              console.log(`  Added: ${relPath}`);
            }
          }
        };

        await addToZip(skillPathObj);

        // 生成ZIP文件
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        // 保存到文件
        await fs.writeFile(skillFilename, zipBuffer);

        console.log(`\n✅ Successfully packaged skill to: ${skillFilename}`);
        return { success: true, message: `Successfully packaged skill to: ${skillFilename}`, zipPath: skillFilename };
      } catch (zipError: any) {
        return { success: false, message: `Error creating .skill file: ${zipError.message}` };
      }
    } catch (error: any) {
      return { success: false, message: `Error packaging skill: ` + error.message };
    }
  }
}

// 主函数，当直接运行此脚本时执行
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: tsx package-skill.ts <skill-path> [output-path]');
    console.log('Example: tsx package-skill.ts ./skills/my-skill');
    console.log('Example: tsx package-skill.ts ./skills/my-skill ./dist');
    return;
  }

  const skillPath = args[0];
  const outputPath = args[1]; // 可选参数

  const packager = new SkillPackager();

  console.log(`Packaging skill: ${skillPath}`);
  if (outputPath) {
    console.log(`   Output directory: ${outputPath}`);
  }
  console.log();

  try {
    const result = await packager.packageSkill(skillPath, outputPath);

    if (result.success) {
      console.log('✅', result.message);
      process.exit(0);
    } else {
      console.log('❌', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error packaging skill:', error.message);
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

export default new SkillPackager();
