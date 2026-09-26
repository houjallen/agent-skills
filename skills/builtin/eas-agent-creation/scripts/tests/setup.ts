/**
 * Vitest 测试设置文件
 *
 * 加载策略：
 * - XDG_* 已由 setupFiles[0] xdg-bootstrap.ts 提前注入（必须早于任何
 *   对 xdg-basedir 的 import）。
 * - 项目 .env / .env.dev 通过 @easbot/utils 的 loadEnv() 统一加载；
 *   不要再用 dotenv 直接读，本文件统一收口。
 *
 * 注：loadEnv 在 .env 里检测到已知无效 key（XDG_* / EASBOT_*_PATH）会
 * 在 dev 模式下打 warn（见 packages/utils/src/utils/env.ts）。
 */
import { loadEnv } from '@easbot/utils';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

loadEnv();
