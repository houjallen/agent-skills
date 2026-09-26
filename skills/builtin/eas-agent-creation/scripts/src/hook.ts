/**
 * HookRegistry — EASBot host 的 hook 事件触发器
 *
 * CLI 场景下为 no-op（仅 log 一行），方便 creation / evolver 等流程
 * 无副作用地跑完。host 加载时可整体替换 HookRegistry 以触发真实 hook 链。
 */
import { Log } from '@easbot/utils';

const log = Log.create({ service: 'hook' });

export namespace HookRegistry {
  /**
   * 触发一个 hook 事件（CLI 场景下 log 一下即返回）。
   *
   * host 加载时可替换为真实实现：读取 hooks/<event>.{ts,json} 并依次执行。
   */
  export async function triggerEvent(event: string, payload: unknown): Promise<void> {
    log.debug('hook:trigger (no-op in CLI)', { event, payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload) : [] });
  }
}
