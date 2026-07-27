#!/usr/bin/env tsx
/**
 * init-agent.ts - Agent 初始化脚本
 *
 * 功能：
 * 1. 创建 .easbot 目录结构
 * 2. 生成 protocol.json 协议文件
 * 3. 生成核心配置文件（BOOT.md、IDENTITY.md、SOUL.md、USER.md）
 *
 * ⚠️ 重要：路径说明
 * - .easbot 目录必须放在 Agent 的 workspace 下
 * - 默认 --output .easbot 会在 workspace 下创建
 * - Agent 运行时会从 {{workspace}}/.easbot/protocol.json 读取配置
 * - --workspace 参数必须由 Agent 传入其 workspace 路径
 *
 * 核心原则：
 * - 必须生成 protocol.json
 * - 所有配置通过 question 工具收集
 * - 禁止人工落盘
 *
 * 使用示例（Agent 调用）：
 *   npx tsx skills/buildin/eas-agent-evolution/scripts/init-agent.ts \
 *     --workspace E:\work\apps\eas\easbot\packages\agent \
 *     --output .easbot \
 *     --agent-name 小莫 \
 *     --user-name jallen
 *
 * 命令行参数（9个）：
 *   --workspace <路径>            Agent 的 workspace 路径（必须传入）
 *   --output <目录>              输出目录，默认 .easbot（相对于 workspace）
 *   --non-interactive            非交互模式
 *   --agent-name <名称>           Agent 身份名称
 *   --user-name <姓名>           用户姓名
 *   --preferred-name <称呼>     用户称呼偏好
 *   --mission <使命>             核心使命
 *   --core-relationship <关系>   核心关系
 *   --core-values <价值观>       核心价值观（逗号分隔）
 *   --behavior-style <风格>      行为风格
 *   --decision-principles <原则> 决策原则（逗号分隔）
 */

import { writeFile, mkdir, access, constants, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

interface InitAgentOptions {
  workspace?: string;
  output?: string;
  nonInteractive?: boolean;
  agentName?: string;
  userName?: string;
  preferredName?: string;
  mission?: string;
  coreRelationship?: string;
  coreValues?: string[];
  behaviorStyle?: string;
  decisionPrinciples?: string[];
}

interface InitResult {
  files: string[];
  skipped: string[];
  errors: string[];
  success: boolean;
  protocolPath?: string;
}

interface ProtocolMetadata {
  agentId: string;
  workspace: string;
  name: string;
  userName: string;
  mission: string;
  preferredName?: string;
  coreRelationship?: string;
  coreValues?: string[];
  behaviorStyle?: string;
  decisionPrinciples?: string[];
}

interface ProtocolConfig {
  version: number;
  bootstrapSeededAt: string;
  setupCompletedAt: string;
  metadata: ProtocolMetadata;
}

async function directoryExists(dir: string): Promise<boolean> {
  try {
    await access(dir, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function sanitizeValue(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/['"]/g, '');
}

function parseCommaSeparated(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => sanitizeValue(s.trim()))
    .filter((s) => s.length > 0);
}

function validateRequiredParams(options: InitAgentOptions): ValidationResult {
  const errors: string[] = [];

  if (!options.workspace || options.workspace.trim() === '') {
    errors.push('workspace (Agent workspace 路径) 为必填参数');
  }

  if (!options.agentName || options.agentName.trim() === '') {
    errors.push('agentName (Agent 名称) 为必填参数');
  }

  if (!options.userName || options.userName.trim() === '') {
    errors.push('userName (用户姓名) 为必填参数');
  }

  if (!options.nonInteractive) {
    if (!options.mission || options.mission.trim() === '') {
      errors.push('mission (核心使命) 为必填参数（交互模式下会自动收集）');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function renderTemplate(template: string, data: Record<string, unknown>, skipVariables: string[] = []): string {
  let result = template;

  for (const [key, value] of Object.entries(data)) {
    if (skipVariables.includes(key)) {
      continue;
    }
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    if (Array.isArray(value) && value.length > 0) {
      result = result.replace(regex, value.join('、'));
    } else {
      result = result.replace(regex, String(value ?? ''));
    }
  }

  return result
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/[ \t]*\n[ \t]*\n[ \t]*\n+/g, '\n\n')
    .replace(/(\n\n)+$/, '\n');
}

async function generateConfigFiles(outputDir: string, metadata: ProtocolMetadata): Promise<{ files: string[]; errors: string[] }> {
  const result = { files: [] as string[], errors: [] as string[] };
  const templatesDir = join(__dirname, '..', 'references', 'templates');

  const templateFiles = [
    { name: 'boot-template.md', output: 'BOOT.md' },
    { name: 'identity-template.md', output: 'IDENTITY.md' },
    { name: 'soul-template.md', output: 'SOUL.md' },
    { name: 'user-template.md', output: 'USER.md' },
  ];

  const templateData: Record<string, unknown> = {
    name: metadata.name,
    userName: metadata.userName,
    preferredName: metadata.preferredName || '',
    mission: metadata.mission,
    coreRelationship: metadata.coreRelationship || '',
    coreValues: metadata.coreValues || [],
    behaviorStyle: metadata.behaviorStyle || '',
    decisionPrinciples: metadata.decisionPrinciples || [],
    emotionalExpression: '',
    experienceSummary: '',
  };

  for (const { name, output } of templateFiles) {
    try {
      const templatePath = join(templatesDir, name);
      const templateContent = await readFile(templatePath, 'utf-8');

      const skipVariables = ['name', 'mission', 'userName'];
      const renderedContent = renderTemplate(templateContent, templateData, skipVariables);
      const outputPath = join(outputDir, output);
      await writeFile(outputPath, renderedContent, 'utf-8');
      result.files.push(outputPath);
    } catch (error) {
      result.errors.push(`Failed to generate ${output}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return result;
}

export async function initAgent(options: InitAgentOptions = {}): Promise<InitResult> {
  const result: InitResult = {
    files: [],
    skipped: [],
    errors: [],
    success: false,
  };

  const outputDir = options.output || '.easbot';

  if (options.nonInteractive) {
    const validation = validateRequiredParams(options);
    if (!validation.valid) {
      result.errors.push(...validation.errors);
      return result;
    }
  }

  try {
    await mkdir(outputDir, { recursive: true });

    const agentName = sanitizeValue(options.agentName) || 'EASBot';
    const metadata: ProtocolMetadata = {
      agentId: `peer-${randomUUID()}`,
      workspace: sanitizeValue(options.workspace),
      name: agentName,
      userName: sanitizeValue(options.userName) || '',
      preferredName: sanitizeValue(options.preferredName) || '',
      mission: sanitizeValue(options.mission) || '',
      coreRelationship: sanitizeValue(options.coreRelationship) || '',
      coreValues: options.coreValues || [],
      behaviorStyle: sanitizeValue(options.behaviorStyle) || '',
      decisionPrinciples: options.decisionPrinciples || [],
    };

    const protocol: ProtocolConfig = {
      version: 1,
      bootstrapSeededAt: new Date().toISOString(),
      setupCompletedAt: new Date().toISOString(),
      metadata,
    };

    const protocolPath = join(outputDir, 'protocol.json');
    const protocolContent = JSON.stringify(protocol, null, 2) + '\n';
    await writeFile(protocolPath, protocolContent, 'utf-8');
    result.protocolPath = protocolPath;
    result.files.push(protocolPath);

    const configResult = await generateConfigFiles(outputDir, metadata);
    result.files.push(...configResult.files);
    result.errors.push(...configResult.errors);

    result.success = true;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  const options: InitAgentOptions = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspace' && args[i + 1]) {
      options.workspace = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[++i];
    } else if (args[i] === '--non-interactive') {
      options.nonInteractive = true;
    } else if (args[i] === '--agent-name' && args[i + 1]) {
      options.agentName = args[++i];
    } else if (args[i] === '--user-name' && args[i + 1]) {
      options.userName = args[++i];
    } else if (args[i] === '--preferred-name' && args[i + 1]) {
      options.preferredName = args[++i];
    } else if (args[i] === '--mission' && args[i + 1]) {
      options.mission = args[++i];
    } else if (args[i] === '--core-relationship' && args[i + 1]) {
      options.coreRelationship = args[++i];
    } else if (args[i] === '--core-values' && args[i + 1]) {
      options.coreValues = parseCommaSeparated(args[++i]);
    } else if (args[i] === '--behavior-style' && args[i + 1]) {
      options.behaviorStyle = args[++i];
    } else if (args[i] === '--decision-principles' && args[i + 1]) {
      options.decisionPrinciples = parseCommaSeparated(args[++i]);
    }
  }

  initAgent(options)
    .then((res) => {
      if (res.success) {
        console.log(`✅ 初始化成功！${res.files.length} 个文件已生成/更新`);
        res.files.forEach((file) => {
          console.log(`   - ${file}`);
        });
        if (res.skipped.length > 0) {
          console.log(`⚠️  跳过 ${res.skipped.length} 个文件`);
          res.skipped.forEach((file) => {
            console.log(`   - ${file}`);
          });
        }
      } else {
        console.error('❌ 初始化失败：');
        res.errors.forEach((error) => {
          console.error(`   - ${error}`);
        });
      }
      process.exit(res.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Init failed:', error);
      process.exit(1);
    });
}

export default initAgent;
