import { COLLECTIONS } from './config';
import { getRaindrops, RaindropArticle } from './services';

/** 把 feeds 转成可读的 md 消息 */
function feedsToMessage(feeds: RaindropArticle[]) {
  let res: string[] = [];
  feeds.forEach((x) => {
    const title = `📖 [${x.title}](${x.link})`;
    res.push(title);
    if (x.tags?.length) {
      const tags = '* 🔖  ' + x.tags.map((x) => x).join(',');
      res.push(tags);
    }
    res.push('---');
  });
  if (res.length) {
    res = ['# 今天的 Raindrop💧 文章推送', '---', ...res];
    // 取消最后一条底线
    res[res.length - 1] = '';
    return res.join('\n\n');
  }
  return '';
}

/** 获取想要的 feeds，目前的规则是前 10 篇中最重要的 3 篇 */
export async function getTodayFeeds() {
  const max = 3;
  const data = await getRaindrops({ id: COLLECTIONS.tomorrow });
  if (!data.length) {
    return '';
  }
  const items = data.length <= max ? data : data.slice(0, max);
  return feedsToMessage(items);
}
