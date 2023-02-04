import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { getArg } from './utils';

const raindropToken = getArg('raindropToken');
const dingdingBotSecret = getArg('secret');
const dingdingBotWebhook = getArg('webhook');

interface RaindropArticle {
  excerpt: string;
  note: string;
  cover: string;
  tags: string[];
  _id: number;
  title: string;
  link: string;
  created: string;
  important: boolean;
  collectionId: number;
}

/** 封装 raindrop oauth */
async function request(opts: AxiosRequestConfig<any> & { log?: boolean }) {
  try {
    const res = await axios({
      ...opts,
      headers: {
        Authorization: 'Bearer ' + raindropToken,
      },
    });
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** 获取 raindrop 的集合 */
async function getRaindropCollection({ title }: { title: string }) {
  const data = await request({
    method: 'get',
    url: 'https://api.raindrop.io/rest/v1/collections',
  });

  if (!data?.items?.length) {
    return null;
  }

  const collection = data.items.find((x) => x.title === title);
  return collection;
}

/** 获取想要的 feeds，目前的规则是前 10 篇中最重要的 3 篇 */
async function getFeeds(collection: RaindropArticle, { max }: { max: number }) {
  const data = await request({
    method: 'get',
    url: `https://api.raindrop.io/rest/v1/raindrops/${collection._id}`,
    params: {
      page: 0,
      perpage: 10,
    },
  });
  if (!data?.items?.length) {
    return [];
  }
  if (data.items.length <= max) {
    return data.items;
  }
  data.items.reverse().sort((a) => (a.important ? -1 : 1));
  return data.items.slice(0, 3);
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
  const sign = crypto
    .createHmac('sha256', dingdingBotSecret!)
    .update(`${timestamp}\n${dingdingBotSecret}`)
    .digest('base64');

  await axios.post(
    `${dingdingBotWebhook}&timestamp=${timestamp}&sign=${sign}`,
    {
      msgtype: 'markdown',
      markdown: {
        title: '今天的 raindrop 文章推送',
        text: msg || '',
      },
      at: {
        isAtAll: false,
      },
    }
  );
}

async function pushRaindropReadList() {
  if (!raindropToken || !dingdingBotSecret || !dingdingBotWebhook) {
    throw { message: 'missing args' };
  }
  const collection = await getRaindropCollection({ title: 'Tomorrow' });
  const feeds = await getFeeds(collection, { max: 3 });
  const msg = await feedsToMessage(feeds);
  if (msg) {
    console.log(msg);
    await pushToBot(msg);
  }
}

pushRaindropReadList();
