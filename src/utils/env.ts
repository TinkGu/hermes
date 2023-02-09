import * as dotenv from 'dotenv';
dotenv.config();

export interface EnvValues {
  /** json store 地址，记录了 rss 的更新信息 */
  rssDbUrl: string;
  /** raindrop API Token */
  raindropToken: string;
  /** 钉钉机器人 webhook 地址 */
  webhook: string;
  /** 钉钉机器人 secret */
  secret: string;
}
