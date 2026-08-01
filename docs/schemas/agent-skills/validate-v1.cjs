#!/usr/bin/env node
/**
 * Lightweight validator for `.well-known/agent-skills/index.json` against
 * `docs/schemas/agent-skills/index.v1.json`.
 *
 * Why hand-rolled (no ajv / js-yaml):
 *   - AGENTS.md §12.7 限制 scripts/ 依赖白名单为 js-yaml / jszip / @easbot/agent
 *   - ajv 若已通过传递依赖存在于 node_modules，pnpm 隔离下 require 不到
 *   - 本校验只覆盖 v1 必需字段与正则约束，零外部依赖
 *
 * 校验目标 shape 与 `scripts/generate-well-known.ts` 的 `IndexSchema` /
 * `IndexSkill` 类型定义保持一致（本校验器是 schema 的镜像实现）：
 *   {
 *     "$schema": "https://easbot.cn/schemas/agent-skills/index.v1.json",
 *     "skills": [
 *       {
 *         "name": "eas-xxx",
 *         "description": "...",
 *         "sourceUrl": "https://.../skills/<cat>/<skill>/SKILL.md",
 *         "installName": "<owner>/<repo>@<skill>",
 *         "scope": "general" | "coder" | "all"  // optional
 *       }
 *     ]
 *   }
 *
 * 退出码：0 = 全部通过；1 = 至少一条错误；2 = 用法错误。
 *
 * 用法：
 *   node docs/schemas/agent-skills/validate-v1.cjs [path/to/index.json]
 *   # 默认校验 .well-known/agent-skills/index.json
 */
const fs = require('node:fs');

const DEFAULT_TARGET = '.well-known/agent-skills/index.json';

const SCHEMA_URL = 'https://easbot.cn/schemas/agent-skills/index.v1.json';

const RE = {
  skillName: /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/,
  ownerRepo: /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/,
  sourceUrl: /^https?:\/\/.+\/skills\/[^/]+\/[^/]+\/SKILL\.md$/,
  installName: /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+@[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/,
  scope: ['general', 'coder', 'all'],
};

let errors = 0;
function err(path, msg, extra) {
  errors++;
  console.log(`  [FAIL] ${path}: ${msg}${extra ? ' ' + JSON.stringify(extra) : ''}`);
}
function ok(path, note) {
  console.log(`  [OK]   ${path}${note ? ' (' + note + ')' : ''}`);
}

function isString(v) {
  return typeof v === 'string';
}
function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function validate(doc) {
  if (!isObject(doc)) throw new Error('index 必须是 object');

  // 顶层必填字段（与 IndexSchema 对齐）
  const requiredTop = ['$schema', 'skills'];
  for (const k of requiredTop) {
    if (!(k in doc)) err('/', `missing required field: ${k}`);
  }

  // $schema 必为 easbot.cn 权威 URL
  if (doc.$schema !== SCHEMA_URL) {
    err('/$schema', `must equal ${SCHEMA_URL}`, { got: doc.$schema });
  } else ok('/$schema');

  // skills
  if (!Array.isArray(doc.skills)) {
    err('/skills', 'must be an array');
  } else if (doc.skills.length === 0) {
    err('/skills', 'must contain at least one skill');
  } else {
    const seen = new Set();
    doc.skills.forEach((sk, i) => {
      const base = `/skills/${i}`;
      if (!isObject(sk)) {
        err(base, 'must be an object');
        return;
      }
      // 必填字段（与 IndexSkill 对齐）
      const req = ['name', 'description', 'sourceUrl', 'installName'];
      for (const k of req) {
        if (!(k in sk)) err(`${base}/${k}`, 'missing required field');
      }
      if (isString(sk.name)) {
        if (!RE.skillName.test(sk.name)) {
          err(`${base}/name`, `must match ${RE.skillName}`, { got: sk.name });
        } else if (seen.has(sk.name)) {
          err(`${base}/name`, `duplicate skill name`, { got: sk.name });
        } else {
          seen.add(sk.name);
        }
      }
      if (isString(sk.description)) {
        if (sk.description.length === 0 || sk.description.length > 1024) {
          err(`${base}/description`, `length must be 1..1024`, { len: sk.description.length });
        }
      }
      if (isString(sk.sourceUrl) && !RE.sourceUrl.test(sk.sourceUrl)) {
        err(`${base}/sourceUrl`, `must match ${RE.sourceUrl}`, { got: sk.sourceUrl });
      }
      if (isString(sk.installName) && !RE.installName.test(sk.installName)) {
        err(`${base}/installName`, `must match ${RE.installName}`, { got: sk.installName });
      }
      if ('scope' in sk) {
        if (!isString(sk.scope) || !RE.scope.includes(sk.scope)) {
          err(`${base}/scope`, `must be one of ${RE.scope.join(' | ')}`, { got: sk.scope });
        }
      }
    });
    if (errors === 0) ok(`/skills`, `${doc.skills.length} item(s)`);
  }
}

function main() {
  const target = process.argv[2] || DEFAULT_TARGET;
  if (!fs.existsSync(target)) {
    console.error(`file not found: ${target}`);
    process.exit(2);
  }
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (e) {
    console.error(`invalid JSON: ${target}: ${e.message}`);
    process.exit(1);
  }
  console.log(`validate ${target} against docs/schemas/agent-skills/index.v1.json`);
  try {
    validate(doc);
  } catch (e) {
    console.error(`schema error: ${e.message}`);
    process.exit(1);
  }
  if (errors > 0) {
    console.log(`\n${errors} error(s)`);
    process.exit(1);
  }
  console.log('\nall checks passed');
}

main();
