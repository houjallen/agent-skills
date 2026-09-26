/**
 * packages/agent/src/creation/assessor.ts
 * 自我评估器：基于 Experience 数据生成 SelfAssessment
 *
 * 设计依据：
 * - 评估窗口内的能力状况
 * - 弱点识别：失败率 > 50% 或样本 < 5 的能力
 * - 机会发现：高频失败的能力 + 高频调用但无对应 Skill
 * - 建议生成：基于上述自动生成 EvolutionPlan 候选
 *
 * 算法：
 * - 成功率 = successCount / totalCount
 * - 弱点严重度：
 *   - high: 失败率 > 80% 且样本 >= 10
 *   - medium: 失败率 > 50% 或样本 < 5
 *   - low: 其他
 * - 机会优先级（0~10）：
 *   - high: 失败率 > 70% 且调用 >= 20 次
 *   - medium: 调用 >= 10 次
 *   - low: 调用 < 10 次
 */

import { Log } from '@easbot/utils';
import type { Memory } from './memory';
import type { CapabilityAssessment, Experience, Opportunity, Recommendation, SelfAssessment, Severity, Weakness } from './types';

/** 评估器日志 */
const log = Log.create({ service: 'creation.assessor' });

/** 评估窗口（天） */
const DEFAULT_WINDOW_DAYS = 7;

/** 最小样本数（低于此数视为"样本不足"） */
const MIN_SAMPLE_SIZE = 5;

/** 弱点阈值 */
const WEAKNESS_FAILURE_RATE_HIGH = 0.8;
const WEAKNESS_FAILURE_RATE_MEDIUM = 0.5;
const HIGH_PRIORITY_CALLS_THRESHOLD = 20;
const MEDIUM_PRIORITY_CALLS_THRESHOLD = 10;

/**
 * SelfAssessor 接口
 */
export interface SelfAssessor {
  /**
   * 评估窗口内的能力状况
   * @param opts 评估选项
   * @param opts.windowDays 评估窗口天数（默认 7 天）
   * @returns 自我评估结果
   */
  assess(opts?: { windowDays?: number }): Promise<SelfAssessment>;
}

// ── 内部聚合结果类型 ─────────────────────────────────────

/**
 * 能力统计数据
 */
interface CapabilityStats {
  /** 引用 ID */
  refId: string;
  /** 能力类型 */
  kind: 'skill' | 'workflow' | 'tool' | 'system';
  /** 总调用次数 */
  totalCalls: number;
  /** 成功次数 */
  successCount: number;
  /** 部分成功次数 */
  partialCount: number;
  /** 失败次数 */
  failureCount: number;
  /** 总耗时（ms） */
  totalDurationMs: number;
  /** Top 3 错误码（按频次） */
  topErrors: Array<{ code: string; count: number }>;
  /** 用户反馈平均分（0~1） */
  avgFeedbackScore: number | null;
}

/**
 * 自我评估器默认实现
 *
 * 基于经验数据分析能力状况、弱点和机会
 */
export class DefaultSelfAssessor implements SelfAssessor {
  private readonly memory: Memory;

  /**
   * 创建自我评估器
   * @param memory 记忆接口实例
   */
  constructor(memory: Memory) {
    this.memory = memory;
  }

  // ── 主入口 ─────────────────────────────────────────────

  /**
   * 执行自我评估
   */
  async assess(opts?: { windowDays?: number }): Promise<SelfAssessment> {
    const windowDays = opts?.windowDays ?? DEFAULT_WINDOW_DAYS;
    const sinceMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;

    log.info('assess:start', { windowDays, sinceMs });

    // 1. 拉取窗口内所有 Experience
    const experiences = await this.memory.queryExperiences({ sinceMs, limit: 10000 });

    if (experiences.length === 0) {
      log.warn('assess:no_data', { windowDays });
      return this.emptyAssessment(windowDays);
    }

    // 2. 按 refId 聚合（统一 key，不区分 action.kind）
    const stats = this.aggregateByRefId(experiences);

    // 3. 生成能力评估
    const capabilities = this.buildCapabilityAssessments(stats);

    // 4. 识别弱点（去重）
    const weaknesses = this.identifyWeaknesses(stats);

    // 5. 发现机会
    const opportunities = this.discoverOpportunities(stats);

    // 6. 生成建议
    const recommendations = this.buildRecommendations(capabilities, weaknesses, opportunities);

    // 7. 计算总分
    const overallScore = this.calculateOverallScore(capabilities);

    const assessment: SelfAssessment = {
      generatedAt: new Date().toISOString(),
      windowDays,
      overallScore,
      capabilities,
      weaknesses,
      opportunities,
      recommendations,
    };

    log.info('assess:done', {
      experiences: experiences.length,
      capabilities: capabilities.length,
      weaknesses: weaknesses.length,
      opportunities: opportunities.length,
      overallScore,
    });

    return assessment;
  }

  // ── 聚合 ───────────────────────────────────────────────

  /**
   * 按 refId 聚合 Experience（不区分 action.kind，避免碎片化）
   */
  private aggregateByRefId(experiences: Experience[]): Map<string, CapabilityStats> {
    const map = new Map<string, CapabilityStats>();

    for (const e of experiences) {
      // 使用 kind:refId 作为 key，保持与测试期望一致
      const key = `${e.action.kind}:${e.action.refId}`;
      let stats = map.get(key);
      if (!stats) {
        stats = {
          refId: e.action.refId,
          kind: e.action.kind,
          totalCalls: 0,
          successCount: 0,
          partialCount: 0,
          failureCount: 0,
          totalDurationMs: 0,
          topErrors: [],
          avgFeedbackScore: null,
        };
        map.set(key, stats);
      }

      stats.totalCalls++;
      stats.totalDurationMs += e.result.durationMs;

      if (e.type === 'success') {
        stats.successCount++;
      } else if (e.type === 'partial') {
        stats.partialCount++;
      } else if (e.type === 'failure') {
        stats.failureCount++;
        if (e.result.error) {
          const existing = stats.topErrors.find((x) => x.code === e.result.error);
          if (existing) {
            existing.count++;
          } else {
            stats.topErrors.push({ code: e.result.error ?? 'unknown', count: 1 });
          }
        }
      }

      // 反馈聚合（滑动平均）
      if (e.feedback?.score !== undefined) {
        if (stats.avgFeedbackScore === null) {
          stats.avgFeedbackScore = e.feedback.score;
        } else {
          stats.avgFeedbackScore = stats.avgFeedbackScore * 0.9 + e.feedback.score * 0.1;
        }
      }
    }

    // 排序 top errors
    for (const stats of map.values()) {
      stats.topErrors.sort((a, b) => b.count - a.count);
      stats.topErrors = stats.topErrors.slice(0, 3);
    }

    return map;
  }

  // ── 能力评估 ───────────────────────────────────────────

  /**
   * 构建能力评估列表
   */
  private buildCapabilityAssessments(stats: Map<string, CapabilityStats>): CapabilityAssessment[] {
    const assessments: CapabilityAssessment[] = [];

    for (const s of stats.values()) {
      const successRate = s.totalCalls > 0 ? s.successCount / s.totalCalls : 0;
      // 综合分数：成功率 0.7 + 反馈分 0.3（如果有反馈）
      let score = successRate;
      if (s.avgFeedbackScore !== null) {
        score = successRate * 0.7 + s.avgFeedbackScore * 0.3;
      }
      assessments.push({
        name: s.refId,
        score: Math.round(score * 100) / 100,
        sampleSize: s.totalCalls,
      });
    }

    return assessments.sort((a, b) => a.score - b.score);
  }

  // ── 弱点识别 ───────────────────────────────────────────

  /**
   * 识别弱点
   *
   * 注意：同一 area 只保留最严重的一条
   */
  private identifyWeaknesses(stats: Map<string, CapabilityStats>): Weakness[] {
    const weaknessMap = new Map<string, Weakness>();
    const seenAreas = new Set<string>();

    for (const s of stats.values()) {
      if (s.totalCalls === 0) continue;

      const failureRate = s.failureCount / s.totalCalls;
      const successRate = s.successCount / s.totalCalls;
      const area = `${s.kind}:${s.refId}`;

      // 规则 1: 高失败率（严重）
      if (failureRate >= WEAKNESS_FAILURE_RATE_HIGH && s.totalCalls >= 10) {
        const weakness: Weakness = {
          area,
          evidence: [
            `${s.failureCount}/${s.totalCalls} failures (${(failureRate * 100).toFixed(1)}%)`,
            `Top errors: ${s.topErrors.map((e) => e.code).join(', ') || 'N/A'}`,
            `Avg latency: ${Math.round(s.totalDurationMs / s.totalCalls)}ms`,
          ],
          severity: 'high',
        };
        // 同一 area 只保留最严重的
        if (!seenAreas.has(area) || weaknessMap.get(area)?.severity !== 'high') {
          weaknessMap.set(area, weakness);
          seenAreas.add(area);
        }
        continue;
      }

      // 规则 2: 中等失败率
      if (failureRate >= WEAKNESS_FAILURE_RATE_MEDIUM) {
        const weakness: Weakness = {
          area,
          evidence: [`${s.failureCount}/${s.totalCalls} failures (${(failureRate * 100).toFixed(1)}%)`, `Top errors: ${s.topErrors.map((e) => e.code).join(', ') || 'N/A'}`],
          severity: 'medium',
        };
        if (!seenAreas.has(area)) {
          weaknessMap.set(area, weakness);
          seenAreas.add(area);
        }
        continue;
      }

      // 规则 3: 样本不足（只有当没有其他弱点时）
      if (s.totalCalls < MIN_SAMPLE_SIZE && successRate < 1) {
        const weakness: Weakness = {
          area,
          evidence: [`Insufficient samples: only ${s.totalCalls} calls`],
          severity: 'medium',
        };
        if (!seenAreas.has(area)) {
          weaknessMap.set(area, weakness);
          seenAreas.add(area);
        }
      }
    }

    const weaknesses = Array.from(weaknessMap.values());
    return weaknesses.sort((a, b) => {
      const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });
  }

  // ── 机会发现 ───────────────────────────────────────────

  /**
   * 发现优化/创造机会
   */
  private discoverOpportunities(stats: Map<string, CapabilityStats>): Opportunity[] {
    const opportunities: Opportunity[] = [];

    for (const s of stats.values()) {
      const failureRate = s.failureCount / s.totalCalls;
      const successRate = s.successCount / s.totalCalls;

      // 规则 1: 高频失败 → 建议优化
      if (failureRate >= 0.7 && s.totalCalls >= HIGH_PRIORITY_CALLS_THRESHOLD) {
        opportunities.push({
          kind: 'optimize',
          rationale: `${s.refId} failure rate ${(failureRate * 100).toFixed(1)}% (${s.failureCount}/${s.totalCalls}), recommend regenerate or revise`,
        });
      }

      // 规则 2: 中等失败率 → 建议合并
      if (failureRate >= 0.4 && failureRate < 0.7 && s.totalCalls >= MEDIUM_PRIORITY_CALLS_THRESHOLD) {
        opportunities.push({
          kind: 'merge',
          rationale: `${s.refId} failure rate ${(failureRate * 100).toFixed(1)}%, may duplicate other capabilities, recommend merge`,
        });
      }

      // 规则 3: 高频成功 → 记录为稳定能力（不生成机会，供后续 Pattern 沉淀）
      if (successRate >= 0.95 && s.totalCalls >= HIGH_PRIORITY_CALLS_THRESHOLD) {
        void successRate;
      }
    }

    return opportunities;
  }

  // ── 建议生成 ───────────────────────────────────────────

  /**
   * 基于弱点和机会生成建议
   */
  private buildRecommendations(_capabilities: CapabilityAssessment[], weaknesses: Weakness[], opportunities: Opportunity[]): Recommendation[] {
    const recs: Recommendation[] = [];

    // 弱点 → 修复
    for (const w of weaknesses) {
      if (w.severity === 'high') {
        recs.push({
          action: `Fix ${w.area} immediately (high severity)`,
          priority: 10,
        });
      } else if (w.severity === 'medium') {
        recs.push({
          action: `Evaluate ${w.area} (medium severity)`,
          priority: 5,
        });
      }
    }

    // 机会 → 创造
    for (const o of opportunities) {
      if (o.kind === 'optimize') {
        recs.push({
          action: `Optimize ${o.rationale}`,
          priority: 8,
        });
      } else if (o.kind === 'merge') {
        recs.push({
          action: `Merge ${o.rationale}`,
          priority: 4,
        });
      } else if (o.kind === 'new-skill') {
        recs.push({
          action: `Create ${o.rationale}`,
          priority: 6,
        });
      }
    }

    return recs.sort((a, b) => b.priority - a.priority);
  }

  // ── 工具方法 ───────────────────────────────────────────

  /**
   * 计算总分（加权平均）
   */
  private calculateOverallScore(capabilities: CapabilityAssessment[]): number {
    if (capabilities.length === 0) return 0;

    // 加权平均：样本越多权重越大
    let weightedSum = 0;
    let totalWeight = 0;
    for (const c of capabilities) {
      const weight = c.sampleSize;
      weightedSum += c.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
  }

  /**
   * 返回空评估（无数据时）
   */
  private emptyAssessment(windowDays: number): SelfAssessment {
    return {
      generatedAt: new Date().toISOString(),
      windowDays,
      overallScore: 0,
      capabilities: [],
      weaknesses: [],
      opportunities: [],
      recommendations: [],
    };
  }
}

/**
 * 创建自我评估器实例
 *
 * @param memory 记忆接口实例
 * @returns 自我评估器实例
 */
export function createSelfAssessor(memory: Memory): SelfAssessor {
  return new DefaultSelfAssessor(memory);
}
