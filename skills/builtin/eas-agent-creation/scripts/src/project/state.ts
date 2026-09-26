import { Log } from '@easbot/utils';

export namespace State {
  interface Entry {
    state: any;
    dispose?: (state: any) => Promise<void>;
  }

  const log = Log.create({ service: 'state' });
  const recordsByKey = new Map<string, Map<string, Entry>>();

  /**
   * 创建按 root key 缓存的状态访问函数
   *
   * P2-4：之前内层 Map 用 `init` 函数引用作 key，导致不同 closure 生成的
   * "同一函数"被视为不同 key → state 实例累积。
   * 现改用 `init.name ?? 'anon'` + 一个递增 fallback：
   * - 若 init 有 name（绝大多数 namespace factory 函数有 name），用 name
   * - 否则用基于 root + 序号生成的稳定字符串 key
   *
   * 注意：fallback key 仅保证同一进程内稳定；跨进程重启也会重建。这是预期行为。
   */
  let __fallbackCounter = 0;
  export function create<S>(root: () => string, init: () => S, dispose?: (state: Awaited<S>) => Promise<void>) {
    // Function 类型 cast：TS 会把 () => S narrow 成 never（控制流分析），用 Function 取出 name
    const fallbackKey = `__anon_${++__fallbackCounter}`;
    const initKey = ((init as Function).name as string) || fallbackKey;
    return () => {
      const key = root();
      let entries = recordsByKey.get(key);
      if (!entries) {
        entries = new Map<string, Entry>();
        recordsByKey.set(key, entries);
      }
      const exists = entries.get(initKey);
      if (exists) return exists.state as S;
      const state = init();
      entries.set(initKey, {
        state,
        dispose,
      });
      return state;
    };
  }

  export async function dispose(key: string) {
    const entries = recordsByKey.get(key);
    if (!entries) return;

    log.info('waiting for state disposal to complete', { key });

    let disposalFinished = false;

    setTimeout(() => {
      if (!disposalFinished) {
        log.warn('state disposal is taking an unusually long time - if it does not complete in a reasonable time, please report this as a bug', { key });
      }
    }, 10000).unref();

    const tasks: Promise<void>[] = [];
    for (const [init, entry] of entries as Map<string, Entry>) {
      if (!entry.dispose) continue;

      const label = typeof init === 'function' ? (init as Function).name : String(init);

      const task = Promise.resolve(entry.state)
        .then((state) => entry.dispose!(state))
        .catch((error) => {
          log.error('Error while disposing state:', { error, key, init: label });
        });

      tasks.push(task);
    }
    await Promise.all(tasks);

    entries.clear();
    recordsByKey.delete(key);

    disposalFinished = true;
    log.info('state disposal completed', { key });
  }
}
