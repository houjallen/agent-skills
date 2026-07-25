#!/usr/bin/env tsx
/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import { dump, load } from 'js-yaml';

const docsDir = path.join(process.cwd(), 'docs');
const date = new Date().toISOString().slice(0, 10);
const author = 'XiaoMo';
const version = '1.0.0';

const getAllMarkdownFiles = (dir: string): string[] => {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
};

const files = getAllMarkdownFiles(docsDir);

const parseFrontMatter = (raw: string) => {
  const lines = raw.split(/\r?\n/);
  const firstLine = lines[0]?.trim();
  if (firstLine !== '---') {
    return { frontmatter: null, content: raw };
  }
  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (endIndex === -1) {
    return { frontmatter: null, content: raw };
  }
  const frontmatterStr = lines.slice(1, endIndex).join('\n');
  const content = lines.slice(endIndex + 1).join('\n');
  try {
    const frontmatter = load(frontmatterStr) as Record<string, unknown>;
    return { frontmatter, content };
  } catch {
    return { frontmatter: null, content: raw };
  }
};

const buildRequiredFrontmatter = (file: string, content: string) => {
  const name = path.basename(file, '.md');
  const keywords = keywordFromName(name);
  const relativePath = path.relative(docsDir, file);
  const dirPath = path.dirname(relativePath);
  const category = dirPath === '.' ? 'documentation' : dirPath.replace(/\\/g, '/');
  const titleLine = content.split(/\r?\n/).find((line) => line.trim().startsWith('# '));
  const title = titleLine?.replace(/^#\s+/, '').trim();
  const description = title ? `${title} 相关文档` : `${name} 相关文档`;
  return {
    name,
    description,
    category,
    author,
    version,
    date,
    keywords,
  };
};

const formatFrontmatter = (frontmatter: Record<string, unknown>) => `---\n${dump(frontmatter, { lineWidth: -1, quotingType: '"' }).trim()}\n---\n`;

const keywordFromName = (name: string) => Array.from(new Set(name.split('-').filter(Boolean)));

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const { frontmatter, content } = parseFrontMatter(raw);
  const required = buildRequiredFrontmatter(file, content);
  const merged = {
    ...(frontmatter ?? {}),
    ...Object.fromEntries(Object.entries(required).filter(([key]) => !(frontmatter && key in frontmatter))),
  } as Record<string, unknown>;

  const updatedContent = `${formatFrontmatter(merged)}${content}`.replace(/\n{3,}$/g, '\n\n');
  fs.writeFileSync(file, updatedContent, 'utf8');
}

console.log(`updated ${files.length} files`);
