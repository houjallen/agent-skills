/**
 * BusEvent 事件定义模块
 *
 * 提供事件类型定义和注册功能。
 */

import z from 'zod';
import type { ZodType } from 'zod';
import { Log } from '@easbot/utils';

/**
 * BusEvent 命名空间
 *
 * 事件定义核心 API，提供事件的类型定义和注册功能。
 */
export namespace BusEvent {
  /**
   * 日志记录器
   */
  const log = Log.create({ service: 'event' });

  /**
   * 事件定义类型
   */
  export type Definition = ReturnType<typeof define>;

  /**
   * 事件注册表
   */
  const registry = new Map<string, Definition>();

  /**
   * 定义事件
   *
   * 创建一个事件定义，包含事件类型和属性模式。
   *
   * @param type - 事件类型标识符
   * @param properties - Zod 属性模式
   * @returns 事件定义对象
   *
   * @example
   * ```typescript
   * const MyEvent = BusEvent.define('my.event', z.object({
   *   data: z.string()
   * }));
   * ```
   */
  export function define<Type extends string, Properties extends ZodType>(type: Type, properties: Properties) {
    const result = {
      type,
      properties,
    };
    registry.set(type, result);
    return result;
  }

  /**
   * 获取所有事件载荷的联合类型
   *
   * 返回一个 discriminated union 类型，包含所有已注册事件的载荷。
   *
   * @returns Zod 联合类型
   */
  export function payloads() {
    return z
      .discriminatedUnion(
        'type',
        registry
          .entries()
          .map(([type, def]) => {
            return z
              .object({
                type: z.literal(type),
                properties: def.properties,
              })
              .meta({
                ref: 'Event' + '.' + def.type,
              });
          })
          .toArray() as any,
      )
      .meta({
        ref: 'Event',
      });
  }
}
