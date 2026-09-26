/**
 * GlobalBus 全局事件总线模块
 *
 * 跨进程事件通信的全局事件发射器。
 */

import { EventEmitter } from 'node:events';

/**
 * 全局事件总线
 *
 * 基于 Node.js EventEmitter 的全局事件发射器，
 * 用于跨进程事件通信。
 */
export const GlobalBus = new EventEmitter<{
  event: [
    {
      directory?: string;
      payload: any;
    },
  ];
}>();
