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

export const RssList: RssRule[] = [cr('https://rsshub.app/github/starred_repos/TinkGu'), cr('https://mdhweekly.com/rss.xml')];
