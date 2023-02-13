export interface RssRule {
  url: string;
  /** 取 feed.items[0] 中的哪个字段作为 lastUpdate 的比较值，默认 "pubDate" */
  flag?: string;
  /** 同 flag，函数写法 */
  flagFn?: (feed?: any) => string;
  /** 标签 */
  tag?: string[];
  /** 优先级，默认 0，越高执行频率越高 */
  level?: number;
}

const cr = (url, options?: Partial<RssRule>) => Object.assign({ url }, options);

enum RssLevel {
  daily = 1000,
  weekly = 10,
}

// 支持 RSS 生成的源网站
// 1. rsshub
// 2. https://rss.lilydjwg.me/

export const RssList: RssRule[] = [
  cr('https://mdhweekly.com/rss.xml'),
  cr('https://rss.lilydjwg.me/zhihuzhuanlan/c_1543658574504751104'),
  cr('https://tw93.fun/feed.xml'),
];
