import axios from 'axios';
import crypto from 'crypto';
import { getArg } from '../../utils';
import { COLLECTIONS } from './config';
import { getRaindrops, RaindropArticle } from './services';

const dingdingBotSecret = getArg('secret');
const dingdingBotWebhook = getArg('webhook');

/** 获取想要的 feeds，目前的规则是前 10 篇中最重要的 3 篇 */
async function getFeeds(collection: { _id: number }, { max }: { max: number }) {
  const data = await getRaindrops({ id: collection._id });
  if (!data.length) {
    return [];
  }
  if (data.length <= max) {
    return data;
  }
  data.reverse().sort((a) => (a.important ? -1 : 1));
  return data.slice(0, 3);
}

/** 把 feeds 转成可读的 md 消息 */
async function feedsToMessage(feeds: RaindropArticle[]) {
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

/** 推送给机器人 */
async function pushToBot(msg: string) {
  const timestamp = Date.now();
  const sign = crypto.createHmac('sha256', dingdingBotSecret!).update(`${timestamp}\n${dingdingBotSecret}`).digest('base64');

  await axios.post(`${dingdingBotWebhook}&timestamp=${timestamp}&sign=${sign}`, {
    msgtype: 'markdown',
    markdown: {
      title: '今天的 raindrop 文章推送',
      text: msg || '',
    },
    at: {
      isAtAll: false,
    },
  });
}

/** 推送 3 篇文章给机器人 */
async function pushRaindropReadList() {
  if (!dingdingBotSecret || !dingdingBotWebhook) {
    throw { message: 'missing args' };
  }
  const feeds = await getFeeds({ _id: COLLECTIONS.tomorrow }, { max: 3 });
  const msg = await feedsToMessage(feeds);
  if (msg) {
    console.log(msg);
    await pushToBot(msg);
  }
}

pushRaindropReadList();
