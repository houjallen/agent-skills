#!/usr/bin/env tsx
/**
 * Session Catchup Script for eas-planning-writer
 *
 * 分析上一个会话以找出上次规划文件更新后的未同步上下文。设计用于在 SessionStart 时运行。
 *
 * 用法: tsx session-catchup.ts [project-path]
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

const PLANNING_FILES = ['task_plan.md', 'progress.md', 'findings.md'];

function getProjectDir(projectPath: string): string {
  /** 将项目路径转换为 Agent 的存储路径格式。 */
  let sanitized = projectPath.replace(/\//g, '-');
  if (!sanitized.startsWith('-')) {
    sanitized = '-' + sanitized;
  }
  sanitized = sanitized.replace(/_/g, '-');
  return path.join(homedir(), '.easbot', 'sessions', sanitized);
}

async function getSessionsSorted(projectDir: string): Promise<string[]> {
  /** 按修改时间（最新的在前）获取所有会话文件。 */
  try {
    const files = await fs.readdir(projectDir);
    const sessionFiles = files.filter((file) => file.endsWith('.jsonl') && !file.startsWith('agent-'));
    const sessionPaths = sessionFiles.map((file) => path.join(projectDir, file));

    // 按修改时间排序（最新的在前）
    const statsWithPaths = await Promise.all(
      sessionPaths.map(async (sessionPath) => {
        const stat = await fs.stat(sessionPath);
        return { path: sessionPath, mtime: stat.mtime };
      }),
    );

    return statsWithPaths.sort((a, b) => b.mtime.getTime() - a.mtime.getTime()).map((item) => item.path);
  } catch (error) {
    return [];
  }
}

interface SessionMessage {
  _line_num: number;
  [key: string]: any;
}

async function parseSessionMessages(sessionFile: string): Promise<SessionMessage[]> {
  /** 从会话文件中解析所有消息，保持顺序。 */
  try {
    const content = await fs.readFile(sessionFile, 'utf-8');
    const lines = content.split('\n');
    const messages: SessionMessage[] = [];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      if (line.trim() === '') continue;

      try {
        const data = JSON.parse(line);
        data._line_num = lineNum;
        messages.push(data);
      } catch (error) {
        // 跳过无效的 JSON 行
      }
    }

    return messages;
  } catch (error) {
    return [];
  }
}

interface UpdateInfo {
  line: number;
  file: string | null;
}

function findLastPlanningUpdate(messages: SessionMessage[]): UpdateInfo {
  /**
   * 查找最后一次规划文件写入/编辑的时间。
   * 返回 {line, file} 或 {-1, null}（如果未找到）。
   */
  let lastUpdateLine = -1;
  let lastUpdateFile: string | null = null;

  for (const msg of messages) {
    const msgType = msg.type;

    if (msgType === 'assistant') {
      const content = msg.message?.content || [];
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === 'tool_use') {
            const toolName = item.name;
            const toolInput = item.input || {};

            if (toolName === 'Write' || toolName === 'Edit') {
              const filePath = toolInput.file_path || '';
              for (const pf of PLANNING_FILES) {
                if (filePath.endsWith(pf)) {
                  lastUpdateLine = msg._line_num;
                  lastUpdateFile = pf;
                }
              }
            }
          }
        }
      }
    }
  }

  return { line: lastUpdateLine, file: lastUpdateFile };
}

interface ExtractedMessage {
  role: string;
  content?: string;
  tools?: string[];
  line: number;
}

function extractMessagesAfter(messages: SessionMessage[], afterLine: number): ExtractedMessage[] {
  /** 提取指定行号之后的对话消息。 */
  const result: ExtractedMessage[] = [];

  for (const msg of messages) {
    if (msg._line_num <= afterLine) {
      continue;
    }

    const msgType = msg.type;
    const isMeta = msg.isMeta || false;

    if (msgType === 'user' && !isMeta) {
      let content = msg.message?.content || '';
      if (Array.isArray(content)) {
        for (const item of content) {
          if (typeof item === 'object' && item.type === 'text') {
            content = item.text || '';
            break;
          }
        }
      } else if (typeof content !== 'string') {
        content = '';
      }

      if (content && typeof content === 'string') {
        if (content.startsWith('<local-command') || content.startsWith('<command-') || content.startsWith('<task-notification')) {
          continue;
        }
        if (content.length > 20) {
          result.push({ role: 'user', content, line: msg._line_num });
        }
      }
    } else if (msg.type === 'assistant') {
      const msgContent = msg.message?.content || '';
      let textContent = '';
      const toolUses: string[] = [];

      if (typeof msgContent === 'string') {
        textContent = msgContent;
      } else if (Array.isArray(msgContent)) {
        for (const item of msgContent) {
          if (item.type === 'text') {
            textContent = item.text || '';
          } else if (item.type === 'tool_use') {
            const toolName = item.name;
            const toolInput = item.input || {};
            if (toolName === 'Edit') {
              toolUses.push(`Edit: ${toolInput.file_path || 'unknown'}`);
            } else if (toolName === 'Write') {
              toolUses.push(`Write: ${toolInput.file_path || 'unknown'}`);
            } else if (toolName === 'Bash') {
              const cmd = toolInput.command ? toolInput.command.substring(0, 80) : '';
              toolUses.push(`Bash: ${cmd}`);
            } else {
              toolUses.push(`${toolName}`);
            }
          }
        }
      }

      if (textContent || toolUses.length > 0) {
        result.push({
          role: 'assistant',
          content: textContent.substring(0, 600),
          tools: toolUses,
          line: msg._line_num,
        });
      }
    }
  }

  return result;
}

async function main(): Promise<void> {
  const projectPath = process.argv[2] || process.cwd();
  const projectDir = getProjectDir(projectPath);

  try {
    await fs.access(projectDir);
  } catch {
    // 无之前的会话，无需追补
    return;
  }

  const sessions = await getSessionsSorted(projectDir);
  if (sessions.length === 0) {
    return;
  }

  // 查找一个实质性之前的会话
  let targetSession: string | null = null;
  for (const session of sessions) {
    try {
      const stat = await fs.stat(session);
      if (stat.size > 5000) {
        targetSession = session;
        break;
      }
    } catch (error) {
      // 忽略文件读取错误
    }
  }

  if (!targetSession) {
    return;
  }

  const messages = await parseSessionMessages(targetSession);
  const { line: lastUpdateLine, file: lastUpdateFile } = findLastPlanningUpdate(messages);

  // 仅在有未同步内容时输出
  let messagesAfter: ExtractedMessage[] = [];
  if (lastUpdateLine < 0) {
    // 如果未找到规划更新，获取最后 30 条消息
    const startIdx = Math.max(0, messages.length - 30);
    messagesAfter = extractMessagesAfter(messages, startIdx);
  } else {
    messagesAfter = extractMessagesAfter(messages, lastUpdateLine);
  }

  if (messagesAfter.length === 0) {
    return;
  }

  // 输出追补报告
  console.log('\n[eas-planning-writer] SESSION CATCHUP DETECTED');
  console.log(`Previous session: ${path.basename(targetSession || '', '.jsonl')}`);

  if (lastUpdateLine >= 0) {
    console.log(`Last planning update: ${lastUpdateFile} at message #${lastUpdateLine}`);
    console.log(`Unsynced messages: ${messagesAfter.length}`);
  } else {
    console.log('No planning file updates found in previous session');
  }

  console.log('\n--- UNSYNCED CONTEXT ---');
  const lastMessages = messagesAfter.slice(-15); // 最后 15 条消息
  for (const msg of lastMessages) {
    if (msg.role === 'user') {
      console.log(`USER: ${msg.content?.substring(0, 300)}`);
    } else {
      if (msg.content) {
        console.log(`AGENT: ${msg.content.substring(0, 300)}`);
      }
      if (msg.tools && msg.tools.length > 0) {
        console.log(`  Tools: ${msg.tools.slice(0, 4).join(', ')}`);
      }
    }
  }

  console.log('\n--- RECOMMENDED ---');
  console.log('1. Run: git diff --stat');
  console.log('2. Read: task_plan.md, progress.md, findings.md');
  console.log('3. Update planning files based on above context');
  console.log('4. Continue with task');
}

// Execute when run directly
if (process.argv[1]?.endsWith('session-catchup.ts')) {
  main().catch((error) => {
    console.error('Error in session catchup:', error);
    process.exit(1);
  });
}
