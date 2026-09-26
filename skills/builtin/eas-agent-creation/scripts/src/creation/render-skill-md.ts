/**
 * Skill Markdown 渲染工具
 *
 * 将 SkillSpec 序列化为 SKILL.md 文本（含 YAML frontmatter）。
 *
 * 设计要点：
 * - 复用 `@easbot/utils` 的 `Markdown.format`，由 gray-matter 走 js-yaml.safeDump
 *   统一处理 YAML 转义（含半角冒号 / 中文冒号 / `#` / `&` / `*` 等特殊字符），
 *   避免手拼 frontmatter 字符串时 description 含特殊字符导致 YAML 解析失败。
 * - creator / evolver 共用此工具，消除"两套实现漂移"风险（曾因 evolver 手拼 YAML
 *   触发 P0 bug：description 含半角冒号时落盘文件无法被 Markdown.parse 解析）。
 */

import { Markdown } from '@easbot/utils';
import type { SkillSpec } from './types';

/**
 * 渲染 SKILL.md 完整文本
 *
 * @param spec Skill 规格
 * @returns 含 YAML frontmatter + body 的 Markdown 字符串
 */
export function renderSkillMarkdown(spec: SkillSpec): string {
  const data: Record<string, unknown> = {
    name: spec.name,
    description: spec.description,
  };
  if (spec.scope) data['scope'] = spec.scope;
  if (spec.mode) data['mode'] = spec.mode;
  if (spec.composition) data['composition'] = spec.composition;
  // secondaryModes 始终以数组形式写入 YAML（保持 spec 数据原貌）；
  // body 模板渲染端如需展示 CSV，由调用方自行 join。
  if (spec.secondaryModes && spec.secondaryModes.length > 0) data['secondaryModes'] = spec.secondaryModes;
  if (spec.deliveryChecklist) data['deliveryChecklist'] = spec.deliveryChecklist;
  if (spec.portability) data['portability'] = spec.portability;
  if (spec.reviewer) data['reviewer'] = spec.reviewer;
  if (spec.behavior) data['behavior'] = spec.behavior;
  if (spec.references && spec.references.length > 0) data['references'] = spec.references;
  return Markdown.format(spec.body, data);
}
