import '../../utils/env';
import axios from 'axios';
import crypto from 'crypto';
import { getArg } from '../../utils';
import { roamFeedsToHungup, roamFeedsToTomorrow, roamFeedsToTrash } from './feed-lifetime';
import { getTodayFeeds } from './today-feed';

const dingdingBotSecret = getArg('secret');
const dingdingBotWebhook = getArg('webhook');

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

async function raindropAction() {
  if (!dingdingBotSecret || !dingdingBotWebhook) {
    throw { message: 'missing args' };
  }

  const ps: any[] = [];
  const tasks = [
    // ...
    () => getTodayFeeds(),
    () => roamFeedsToTomorrow(),
    () => roamFeedsToHungup(),
    // () => roamFeedsToTrash(),
  ];
  tasks.forEach((task) => {
    try {
      ps.push(task());
    } catch (err) {
      console.error(err);
    }
  });

  const res = await Promise.allSettled(ps);
  const msg = res
    .filter((x) => x.status === 'fulfilled')
    .map((x: any) => x.value)
    .filter((x) => !!x)
    .join('\n\n');

  if (msg) {
    console.log(msg);
    await pushToBot(msg);
  }
}

raindropAction();
