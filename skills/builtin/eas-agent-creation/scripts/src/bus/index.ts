/**
 * Bus 事件总线模块
 *
 * 应用程序内的事件发布订阅系统，支持进程内和跨进程事件通信。
 *
 * 主要功能：
 * - 事件发布和订阅
 * - 一次性订阅（once）
 * - 通配符订阅
 * - 全局事件广播
 *
 * @example
 * ```typescript
 * // 订阅事件
 * const unsubscribe = Bus.subscribe(MyEvent, (event) => {
 *   console.log(event.properties);
 * });
 *
 * // 发布事件
 * await Bus.publishSafe(MyEvent, { data: 'value' });
 *
 * // 一次性订阅
 * Bus.once(MyEvent, (event) => {
 *   console.log(event.properties);
 *   return 'done'; // 返回 'done' 表示完成
 * });
 * ```
 */

import z from 'zod';
import { Log } from '@easbot/utils';
import { Instance } from '../project/instance';
import { BusEvent } from './bus-event';
import { GlobalBus } from './global';

/**
 * Bus 命名空间
 *
 * 事件总线核心 API，提供事件的发布和订阅功能。
 */
export namespace Bus {
  /**
   * 日志记录器
   */
  const log = Log.create({ service: 'bus' });

  /**
   * 订阅回调类型
   */
  type Subscription = (event: any) => void;

  /**
   * 实例释放事件
   *
   * 当服务器实例被释放时触发。
   */
  export const InstanceDisposed = BusEvent.define(
    'server.instance.disposed',
    z.object({
      directory: z.string(),
    }),
  );

  /**
   * 状态结果类型
   *
   * 包含订阅者映射表
   */
  type StateResult = {
    subscriptions: Map<any, Subscription[]>;
  };

  /**
   * 状态工厂实例
   */
  let _stateFactory: (() => Promise<StateResult>) | undefined;

  /**
   * 获取状态工厂函数
   *
   * @returns 状态工厂函数
   */
  function getStateFactory(): () => Promise<StateResult> {
    if (!_stateFactory) {
      _stateFactory = Instance.state(
        async (): Promise<StateResult> => {
          const subscriptions = new Map<any, Subscription[]>();

          return {
            subscriptions,
          };
        },
        async (entry) => {
          const wildcard = entry.subscriptions.get('*');
          if (!wildcard) return;
          const event = {
            type: InstanceDisposed.type,
            properties: {
              directory: Instance.directory,
            },
          };
          for (const sub of [...wildcard]) {
            sub(event);
          }
        },
      );
    }
    return _stateFactory;
  }

  /**
   * 获取状态
   *
   * @returns 状态 Promise
   */
  function state(): Promise<StateResult> {
    return getStateFactory()();
  }

  /**
   * 发布事件
   *
   * 向所有订阅者广播事件。
   *
   * @param def - 事件定义
   * @param properties - 事件属性
   *
   * @example
   * ```typescript
   * await Bus.publishSafe(MyEvent, { data: 'value' });
   * ```
   */
  export async function publish<Definition extends BusEvent.Definition>(def: Definition, properties: z.output<Definition['properties']>) {
    const payload = {
      type: def.type,
      properties,
    };
    log.debug('publishing', {
      type: def.type,
    });
    const pending = [];
    const s = await state();
    for (const key of [def.type, '*']) {
      const match = s.subscriptions.get(key);
      for (const sub of match ?? []) {
        pending.push(sub(payload));
      }
    }
    GlobalBus.emit('event', {
      directory: Instance.directory,
      payload,
    });
    return Promise.all(pending);
  }

  /**
   * 安全发布事件（统一错误兜底）
   *
   * 与 `publish` 等价，但会自动捕获订阅者抛出的错误并记录日志，
   * 避免订阅链路上的单个错误把主流程带崩。
   *
   * 适用场景：
   * - fire-and-forget 通知（替代 `await Bus.publishSafe(...)`）
   * - 不希望主流程被订阅者异常阻塞的 `await` 路径
   *
   * 如果业务侧**必须**依赖订阅者全部成功，请改用 `Bus.publish` 并自行 try/catch。
   *
   * @param def - 事件定义
   * @param properties - 事件属性
   */
  export function publishSafe<Definition extends BusEvent.Definition>(def: Definition, properties: z.output<Definition['properties']>): Promise<void> {
    void publish(def, properties).catch((error) => {
      log.error('bus publish failed', { type: def.type, error: error.message ?? String(error) });
    });
    return Promise.resolve();
  }

  /**
   * 订阅事件
   *
   * 注册一个回调函数，当事件触发时被调用。
   *
   * @param def - 事件定义
   * @param callback - 事件回调函数
   * @returns 取消订阅的函数
   *
   * @example
   * ```typescript
   * const unsubscribe = Bus.subscribe(MyEvent, (event) => {
   *   console.log(event.properties);
   * });
   * // 取消订阅
   * unsubscribe();
   * ```
   */
  export function subscribe<Definition extends BusEvent.Definition>(def: Definition, callback: (event: { type: Definition['type']; properties: z.infer<Definition['properties']> }) => void) {
    return raw(def.type, callback);
  }

  /**
   * 一次性订阅
   *
   * 注册一个回调函数，事件触发一次后自动取消订阅。
   *
   * @param def - 事件定义
   * @param callback - 事件回调函数，返回 'done' 表示完成
   *
   * @example
   * ```typescript
   * Bus.once(MyEvent, (event) => {
   *   console.log(event.properties);
   *   return 'done';
   * });
   * ```
   */
  export function once<Definition extends BusEvent.Definition>(def: Definition, callback: (event: { type: Definition['type']; properties: z.infer<Definition['properties']> }) => 'done' | undefined) {
    const unsub = subscribe(def, (event) => {
      if (callback(event)) unsub();
    });
  }

  /**
   * 订阅所有事件
   *
   * 注册一个回调函数，接收所有事件。
   *
   * @param callback - 事件回调函数
   * @returns 取消订阅的函数
   */
  export function subscribeAll(callback: (event: any) => void) {
    return raw('*', callback);
  }

  /**
   * 原始订阅
   *
   * 低级订阅函数，直接按事件类型订阅。
   *
   * @param type - 事件类型
   * @param callback - 回调函数
   * @returns 取消订阅的函数
   */
  function raw(type: string, callback: (event: any) => void) {
    log.debug('subscribing', { type });
    const promise = state().then((s) => {
      const subscriptions = s.subscriptions;
      const match = subscriptions.get(type) ?? [];
      match.push(callback);
      subscriptions.set(type, match);
    });

    return () => {
      log.debug('unsubscribing', { type });
      void state().then((s) => {
        const match = s.subscriptions.get(type);
        if (!match) return;
        const index = match.indexOf(callback);
        if (index === -1) return;
        match.splice(index, 1);
      });
    };
  }

  /**
   * 等待订阅完成
   *
   * 内部使用，等待订阅初始化完成。
   */
  export async function waitForSubscription() {
    await state();
  }
}
