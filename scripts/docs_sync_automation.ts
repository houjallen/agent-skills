#!/usr/bin/env tsx

/// <reference types="node" />
import * as fs from 'fs/promises';
import * as path from 'path';
import { load, dump } from 'js-yaml';

// 文档前端属性类型定义（用普通对象表示）
const DocFrontMatter = {
  name: String,
  description: String,
  category: String,
  author: String,
  version: String,
  date: String,
  keywords: Array,
  updateHistory: Array,
  encrypted: Boolean,
  tags: Array,
  license: String,
  contributors: Array,
};

/**
 * 从 Markdown 文件中解析 frontmatter
 */
async function parseFrontMatter(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    // 使用更灵活的方式分割行，处理不同平台的换行符
    const lines = content.split(/\r?\n/); // 支持 \n, \r\n, 和 \r

    // 检查并处理可能的 BOM（Byte Order Mark）
    let firstLine = lines[0];
    if (firstLine && firstLine.charCodeAt(0) === 0xfeff) {
      firstLine = firstLine.substring(1); // 移除 BOM
    }

    if (firstLine?.trim() === '---') {
      let frontmatterEnd = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i]?.trim() === '---') {
          frontmatterEnd = i;
          break;
        }
      }

      if (frontmatterEnd > 0) {
        // 提取 frontmatter 部分（跳过第一行的 ---）
        const frontmatterLines = lines.slice(1, frontmatterEnd);
        const frontmatterStr = frontmatterLines.join('\n');

        try {
          const frontmatter = load(frontmatterStr) as any;
          // 剩余内容（跳过结束的 --- 行）
          const remainingLines = lines.slice(frontmatterEnd + 1);
          const remainingContent = remainingLines.join('\n');

          return { frontmatter, content: remainingContent };
        } catch (parseError) {
          console.error(`YAML parse error in ${filePath}:`, parseError);
          console.log(`Problematic frontmatter content:\n${frontmatterStr}`);
          return { frontmatter: null, content };
        }
      }
    }

    return { frontmatter: null, content };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return { frontmatter: null, content: '' };
  }
}

/**
 * 将 frontmatter 对象转换为字符串格式
 */
function stringifyFrontMatter(frontmatter: any) {
  const frontmatterCopy = {
    ...frontmatter,
    date: frontmatter.date ? new Date(frontmatter.date).toISOString().slice(0, 10) : '',
    keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
  };
  return `---\n${dump(frontmatterCopy, { lineWidth: -1, quotingType: '"' }).trim()}\n---\n`;
}

/**
 * 递归遍历目录，获取所有 Markdown 文件
 */
async function getAllMarkdownFiles(dir: string, excludedDirs: string[] = []) {
  const results: string[] = [];
  let items: import('fs').Dirent[] = []; // 显式声明类型
  try {
    items = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    // 如果目录不存在，返回空数组
    return [];
  }

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // 如果是排除的目录，跳过
      if (!excludedDirs.includes(item.name)) {
        const subDirResults = await getAllMarkdownFiles(fullPath, excludedDirs);
        results.push(...subDirResults);
      }
    } else if (item.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * 验证文档是否符合规范
 */
async function validateDoc(filePath: string) {
  const { frontmatter } = await parseFrontMatter(filePath);

  if (!frontmatter) {
    console.log(`❌ Missing frontmatter: ${filePath}`);
    return false;
  }

  // 检查必需字段 - 只检查真正必要的字段
  const requiredFields = ['name', 'description', 'author']; // 只有这几个是真正必需的
  const missingFields = requiredFields.filter((field) => !(field in frontmatter));

  if (missingFields.length > 0) {
    console.log(`❌ Missing required fields [${missingFields.join(', ')}] in: ${filePath}`);
    return false;
  }

  return true;
}

/**
 * 修复文档的 category 属性以匹配其路径
 */
async function fixCategoryForDoc(filePath: string) {
  const { frontmatter, content } = await parseFrontMatter(filePath);

  if (!frontmatter) {
    console.log(`No frontmatter found in ${filePath}, skipping...`);
    return false;
  }

  // 获取相对于 docs 目录的路径
  const docsDir = path.join(process.cwd(), 'docs');
  const relativePath = path.relative(docsDir, filePath);
  const dirPath = path.dirname(relativePath);

  // 获取完整目录路径作为 category（如果是根目录则用 'documentation'）
  const category = dirPath === '.' ? 'documentation' : dirPath.replace(/\\/g, '/');

  if (frontmatter.category !== category) {
    console.log(`🔄 Updating category for ${path.basename(filePath)}: ${frontmatter.category} -> ${category}`);
    frontmatter.category = category;

    // 写回文件
    const updatedContent = stringifyFrontMatter(frontmatter) + content;
    await fs.writeFile(filePath, updatedContent, 'utf-8');
    return true;
  }

  return false;
}

/**
 * 修复文档的 name 属性以匹配文件名或反之
 */
async function fixNameForDoc(filePath: string) {
  const { frontmatter, content } = await parseFrontMatter(filePath);

  if (!frontmatter) {
    console.log(`No frontmatter found in ${filePath}, skipping...`);
    return false;
  }

  // 从文件路径获取文件名（不含扩展名）
  const fileNameWithoutExt = path.basename(filePath, path.extname(filePath));

  // 如果 name 属性为空，使用文件名作为 name
  if (!frontmatter.name || frontmatter.name.trim() === '') {
    const newName = fileNameWithoutExt.toLowerCase(); // 转为小写
    console.log(`🔄 Setting name for ${path.basename(filePath)} from filename: (empty) -> ${newName}`);
    frontmatter.name = newName;

    // 写回文件
    const updatedContent = stringifyFrontMatter(frontmatter) + content;
    await fs.writeFile(filePath, updatedContent, 'utf-8');
    return true;
  }
  // 如果 name 属性不为空，确保文件名与 name 属性匹配
  else if (frontmatter.name !== fileNameWithoutExt) {
    // 生成符合 name 属性的文件名
    const expectedFileName =
      frontmatter.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '') + path.extname(filePath);

    if (fileNameWithoutExt !== expectedFileName) {
      const dirPath = path.dirname(filePath);
      const newFilePath = path.join(dirPath, expectedFileName);

      // 检查目标文件是否已存在
      try {
        await fs.access(newFilePath);
        console.log(`⚠️  Target file already exists, skipping rename: ${path.basename(filePath)} -> ${expectedFileName}`);
        return false;
      } catch {
        // 文件不存在，可以安全重命名
        console.log(`🔄 Renaming ${path.basename(filePath)} to ${expectedFileName} in ${dirPath}`);
        await fs.rename(filePath, newFilePath);
        return true;
      }
    }
  }

  return false;
}

/**
 * 验证并修复所有文档的文件名以匹配其 name 属性
 */
async function fixAllDocNames() {
  const docsDir = path.join(process.cwd(), 'docs');
  const excludedDirs = ['node_modules', '.git', '.vscode', '.idea', 'logs', 'temp', 'tmp', 'cache', 'dist', 'build'];
  const allMdFiles = await getAllMarkdownFiles(docsDir, excludedDirs);
  let updatedCount = 0;

  for (const filePath of allMdFiles) {
    // 排除根目录的 README.md 文件
    const fileName = path.basename(filePath);
    const dirPath = path.dirname(filePath);
    if (fileName === 'README.md' && dirPath === path.join(process.cwd(), 'docs')) {
      continue;
    }

    const updated = await fixNameForDoc(filePath);
    if (updated) updatedCount++;
  }

  return updatedCount;
}

/**
 * 生成 docs/README.md 的目录结构
 */
async function generateDocsIndex() {
  const docsDir = path.join(process.cwd(), 'docs');
  const readmePath = path.join(docsDir, 'README.md');

  // 获取所有目录（排除一些系统或日志目录）
  const excludedDirs = ['node_modules', '.git', '.vscode', '.idea', 'logs', 'temp', 'tmp', 'cache', 'dist', 'build'];
  // 特殊目录：这些目录存在但不在 README 中显示详细索引（例如日志目录），但仍会在目录结构中显示
  const noIndexDirs = ['journal']; // 不在 README 中生成文件索引的目录

  // 递归读取目录结构的函数
  async function readDirectoryStructure(currentPath: string, basePath: string, depth = 0) {
    let result = '';

    // 获取当前目录下的所有项目
    const items = await fs.readdir(currentPath, { withFileTypes: true });
    const dirs = items.filter((item) => item.isDirectory() && !excludedDirs.includes(item.name)).sort((a, b) => a.name.localeCompare(b.name));

    const files = items.filter((item) => item.isFile() && item.name.endsWith('.md')).sort((a, b) => a.name.localeCompare(b.name));

    // 为每个子目录生成内容
    for (const dir of dirs) {
      const relativePath = path.relative(basePath, path.join(currentPath, dir.name)).replace(/\\/g, '/');

      // 检查当前目录是否在 noIndexDirs 中，或者是 noIndex 目录的子目录
      const isNoIndexDir = noIndexDirs.some((noIndexDir) => relativePath === noIndexDir || relativePath.startsWith(noIndexDir + '/'));

      const indent = '#'.repeat(depth + 3); // 从###开始，每层加深

      result += `${indent} [${relativePath}/](./${relativePath}/)
`;

      // 如果是不需要索引的目录或其子目录，则只显示一个描述而不列出文件
      if (isNoIndexDir) {
        result += `- 空目录，用于存放 ${relativePath} 相关文档\n`;
      } else {
        // 获取该目录下的所有文档
        const dirPath = path.join(currentPath, dir.name);
        const subItems = await fs.readdir(dirPath, { withFileTypes: true });
        const subFiles = subItems
          .filter((item) => item.isFile() && item.name.endsWith('.md'))
          .map((item) => item.name)
          .sort();

        if (subFiles.length > 0) {
          for (const file of subFiles) {
            result += `- [${file}](./${relativePath}/${file})\n`;
          }
        } else {
          result += `- 空目录，用于存放 ${relativePath} 相关文档\n`;
        }
      }

      result += '\n';

      // 递归处理子目录，除非当前目录或其祖先目录在 noIndexDirs 中
      if (!isNoIndexDir) {
        const subDirPath = path.join(currentPath, dir.name);
        result += await readDirectoryStructure(subDirPath, basePath, depth + 1);
      }
    }

    return result;
  }

  // 生成新的 README 内容
  let readmeContent = `---
name: easbot-documentation-index
description: EASBOT 项目文档中心的目录索引，提供对所有文档的导航和访问指引
category: documentation
author: EASBOT Team
version: 1.0.0
date: ${new Date().toISOString().split('T')[0]}
keywords: [easbot, documentation, index, navigation, ai-assistant]
updateHistory:
  - date: ${new Date().toISOString().split('T')[0]}
    version: 1.0.0
    changes: Automated update of documentation index
encrypted: false
tags: [documentation, index, navigation]
license: MIT
contributors:
  - Name: EASBOT Team
    role: Maintainer
---
# EASBOT 文档目录

欢迎来到 EASBOT 项目的文档中心。本项目是一个先进的 AI 助手系统，建立在 OpenCode 框架之上，提供动态技能生成、智能工作流和自我演进能力。

## 目录结构

`;

  // 从根目录开始构建目录结构
  readmeContent += await readDirectoryStructure(docsDir, docsDir, 0);

  readmeContent += `## 文档分类原则

### 按功能模块划分
- **architecture/** - 系统整体架构和设计方案
- **components/** - 各个独立组件的具体实现说明
- **api/** - 接口定义和使用说明
- **design/** - UI/UX 设计和交互指南

### 按文档类型划分
- **specifications/** - 技术规范和标准
- **planning/** - 规划和路线图文档
- **concepts/** - 概念和原理说明
- **reference/** - 参考资料和最佳实践
- **research/** - 研究报告和技术分析

### 按使用场景划分
- **tutorials/** - 新手教程和入门指南
- **guides/** - 详细操作指南
- **troubleshooting/** - 故障排除和常见问题

## 贡献指南

当添加新文档时，请遵循以下原则：

1. **选择合适目录**：根据文档内容和用途选择最适合的目录
2. **命名规范**：使用有意义的文件名，最好使用下划线分隔单词
3. **保持一致**：遵循现有的文档格式和风格
4. **更新索引**：确保在此 README 中添加新文档的链接

## 维护说明

- 此 README 应始终保持最新，准确反映当前文档结构
- 当新增或删除文档时，请相应更新此文件
- 定期审查文档结构，确保其仍然符合项目发展需求
`;

  await fs.writeFile(readmePath, readmeContent, 'utf-8');
  console.log('✅ Updated docs/README.md with new directory structure');
}

/**
 * 验证所有文档是否符合规范
 */
async function validateAllDocs() {
  const docsDir = path.join(process.cwd(), 'docs');
  const excludedDirs = ['node_modules', '.git', '.vscode', '.idea', 'logs', 'temp', 'tmp', 'cache', 'dist', 'build'];
  const allMdFiles = await getAllMarkdownFiles(docsDir, excludedDirs);

  console.log('🔍 Validating documentation files...\n');

  let validCount = 0;
  let invalidCount = 0;

  for (const file of allMdFiles) {
    const isValid = await validateDoc(file);
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }
  }

  console.log(`\n📊 Validation Summary:`);
  console.log(`   Valid documents: ${validCount}`);
  console.log(`   Invalid documents: ${invalidCount}`);
  console.log(`   Total documents: ${validCount + invalidCount}`);
}

/**
 * 修复所有文档的 category 属性
 */
async function fixAllCategories() {
  const docsDir = path.join(process.cwd(), 'docs');
  const excludedDirs = ['node_modules', '.git', '.vscode', '.idea', 'logs', 'temp', 'tmp', 'cache', 'dist', 'build'];
  const allMdFiles = await getAllMarkdownFiles(docsDir, excludedDirs);

  console.log('🔧 Fixing category attributes for all documents...\n');

  let updatedCount = 0;
  for (const file of allMdFiles) {
    const updated = await fixCategoryForDoc(file);
    if (updated) updatedCount++;
  }

  console.log(`\n📊 Fixed ${updatedCount} documents with correct category.`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🔄 Starting documentation synchronization and automation...\n');

  // 1. 修复所有文档的 category 属性
  await fixAllCategories();

  // 2. 修复所有文档的文件名以匹配其 name 属性
  console.log('\n📝 Fixing document names to match name attribute...');
  const renamedCount = await fixAllDocNames();
  console.log(`✅ Renamed ${renamedCount} documents to match their name attributes.`);

  // 3. 生成新的 README
  console.log('\n📋 Generating new documentation index...');
  await generateDocsIndex();

  // 4. 验证所有文档
  console.log('\n🔍 Validating all documents...');
  await validateAllDocs();

  console.log('\n✅ Documentation synchronization and automation completed!');
}

// 运行主函数
main().catch(console.error);
