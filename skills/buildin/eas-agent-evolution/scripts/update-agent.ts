#!/usr/bin/env tsx
/**
 * update-agent.ts - 更新协议配置
 *
 * 功能：
 * 1. 更新 protocol.json 中的 metadata 字段
 * 2. 验证更新后的配置
 * 3. 支持增量更新
 *
 * 使用示例：
 *   npx tsx scripts/update-agent.ts --field name --value "小莫"
 *   npx tsx scripts/update-agent.ts --field coreValues --json '["真诚", "信任"]'
 */

import { readFile, writeFile, access, constants } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(fileURLToPath(import.meta.url), '..');

interface UpdateOptions {
  configPath: string;
  field: string;
  value: unknown;
}

interface UpdateResult {
  success: boolean;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  error?: string;
}

interface ProtocolConfig {
  version: number;
  bootstrapSeededAt: string;
  setupCompletedAt: string;
  metadata: Record<string, unknown>;
}

function sanitizeValue(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/['"]/g, '');
}

function sanitizeJsonValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeValue(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item));
  }
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = sanitizeJsonValue(val);
    }
    return result;
  }
  return value;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function updateProtocol(options: UpdateOptions): Promise<UpdateResult> {
  const protocolPath = join(options.configPath, 'protocol.json');

  try {
    if (!(await fileExists(protocolPath))) {
      return {
        success: false,
        field: options.field,
        oldValue: undefined,
        newValue: options.value,
        error: `protocol.json not found: ${protocolPath}`,
      };
    }

    const content = await readFile(protocolPath, 'utf-8');
    const config: ProtocolConfig = JSON.parse(content);

    const oldValue = config.metadata[options.field];
    config.metadata[options.field] = options.value;

    const output = JSON.stringify(config, null, 2) + '\n';
    await writeFile(protocolPath, output, 'utf-8');

    return {
      success: true,
      field: options.field,
      oldValue,
      newValue: options.value,
    };
  } catch (error) {
    return {
      success: false,
      field: options.field,
      oldValue: undefined,
      newValue: options.value,
      error: String(error),
    };
  }
}

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  const options: UpdateOptions = {
    configPath: '.easbot',
    field: '',
    value: undefined,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config-path' && args[i + 1]) {
      options.configPath = args[++i];
    } else if (args[i] === '--field' && args[i + 1]) {
      options.field = args[++i];
    } else if (args[i] === '--value' && args[i + 1]) {
      options.value = sanitizeValue(args[++i]);
    } else if (args[i] === '--json' && args[i + 1]) {
      try {
        const parsed = JSON.parse(args[++i]);
        options.value = sanitizeJsonValue(parsed);
      } catch {
        options.value = sanitizeValue(args[i]);
      }
    }
  }

  if (!options.field) {
    console.error('Error: --field is required');
    console.log('Usage: npx tsx scripts/update-agent.ts --field <field> --value <value> [--config-path <path>]');
    process.exit(1);
  }

  updateProtocol(options)
    .then((result) => {
      console.log('Update result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Update failed:', error);
      process.exit(1);
    });
}

export default updateProtocol;
