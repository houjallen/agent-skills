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
 * 退出码：0 = 全部通过；1 = 至少一条错误；2 = 用法错误。
 *
 * 用法：
 *   node docs/schemas/agent-skills/validate-v1.cjs [path/to/index.json]
 *   # 默认校验 .well-known/agent-skills/index.json
 */
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_TARGET = '.well-known/agent-skills/index.json';

const SCHEMA_VERSION = '1.0.0';
const SCHEMA_ENDPOINT = '/.well-known/agent-skills/index.json';
const SCHEMA_URL = 'https://easbot.cn/schemas/agent-skills/index.v1.json';

const RE = {
  skillName: /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/,
  repoSlug: /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/,
  semver: /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/,
  tag: /^[a-z0-9][a-z0-9-]*$/,
  sourceUrl: /^\.\/.+\/SKILL\.md$/,
  installName: /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+:[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/,
  sourcePath: /^\.\//,
};

let errors = 0;
function err(path, msg, extra) {
  errors++;
  console.log(`  [FAIL] ${path}: ${msg}${extra ? ' ' + JSON.stringify(extra) : ''}`);
}
function ok(path) {
  console.log(`  [OK]   ${path}`);
}

function isString(v) {
  return typeof v === 'string';
}
function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function validate(doc) {
  // 顶层
  if (!isObject(doc)) throw new Error('index 必须是 object');
  const required = ['$schema', 'version', 'endpoint', 'generated_at', 'source', 'skills'];
  for (const k of required) {
    if (!(k in doc)) err('/', `missing required field: ${k}`);
  }

  if (doc.$schema !== SCHEMA_URL) {
    err('/$schema', `must equal ${SCHEMA_URL}`, { got: doc.$schema });
  } else ok('/$schema');

  if (doc.version !== SCHEMA_VERSION) {
    err('/version', `must equal ${SCHEMA_VERSION}`, { got: doc.version });
  } else ok('/version');

  if (doc.endpoint !== SCHEMA_ENDPOINT) {
    err('/endpoint', `must equal ${SCHEMA_ENDPOINT}`, { got: doc.endpoint });
  } else ok('/endpoint');

  if (!isString(doc.generated_at) || Number.isNaN(Date.parse(doc.generated_at))) {
    err('/generated_at', `must be a valid ISO 8601 date-time`, { got: doc.generated_at });
  } else ok('/generated_at');

  // source
  if (!isObject(doc.source)) {
    err('/source', 'must be an object');
  } else {
    const s = doc.source;
    if (s.type !== 'git') err('/source/type', `must equal "git"`, { got: s.type });
    if (!isString(s.repo) || !RE.repoSlug.test(s.repo)) {
      err('/source/repo', `must match ${RE.repoSlug}`, { got: s.repo });
    }
    if (!isString(s.ref) || s.ref.length === 0) {
      err('/source/ref', 'must be a non-empty string', { got: s.ref });
    }
    if (!isString(s.path) || !RE.sourcePath.test(s.path)) {
      err('/source/path', `must start with "./"`, { got: s.path });
    }
    if (s.type === 'git' && isString(s.repo) && RE.repoSlug.test(s.repo) && isString(s.ref) && isString(s.path) && RE.sourcePath.test(s.path)) {
      ok('/source');
    }
  }

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
      const req = ['name', 'category', 'description', 'version', 'sourceUrl', 'installName'];
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
      if (isString(sk.category) && !['builtin', 'tools'].includes(sk.category)) {
        err(`${base}/category`, `must be "builtin" or "tools"`, { got: sk.category });
      }
      if (isString(sk.description)) {
        if (sk.description.length === 0 || sk.description.length > 1024) {
          err(`${base}/description`, `length must be 1..1024`, { len: sk.description.length });
        }
      }
      if (isString(sk.version) && !RE.semver.test(sk.version)) {
        err(`${base}/version`, `must be semver`, { got: sk.version });
      }
      if (isString(sk.sourceUrl) && !RE.sourceUrl.test(sk.sourceUrl)) {
        err(`${base}/sourceUrl`, `must match ${RE.sourceUrl}`, { got: sk.sourceUrl });
      }
      if (isString(sk.installName) && !RE.installName.test(sk.installName)) {
        err(`${base}/installName`, `must match ${RE.installName}`, { got: sk.installName });
      }
      if ('tags' in sk) {
        if (!Array.isArray(sk.tags)) {
          err(`${base}/tags`, 'must be an array if present');
        } else {
          const seenTag = new Set();
          sk.tags.forEach((t, j) => {
            if (!isString(t) || !RE.tag.test(t)) {
              err(`${base}/tags/${j}`, `must match ${RE.tag}`, { got: t });
            } else if (seenTag.has(t)) {
              err(`${base}/tags/${j}`, 'duplicate tag', { got: t });
            } else {
              seenTag.add(t);
            }
          });
        }
      }
      if ('metadata' in sk && !isObject(sk.metadata)) {
        err(`${base}/metadata`, 'must be an object if present');
      }
    });
    if (errors === 0) ok(`/skills (${doc.skills.length})`);
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
