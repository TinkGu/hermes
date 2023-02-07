import Parser from 'rss-parser';
import axios from 'axios';
import { getArg, logToFile } from '.';
import { JsonDB } from './db';
import { RssList, RssRule } from '../configs/rss-list';

const RssDbUrl = getArg('rssDbUrl')!;

/** 获取 rss 内容 */
export async function fetchRssFeed(rule: RssRule) {
  if (!rule?.url) return;
  const res = await axios.get(rule.url, { timeout: 60000 });
  if (!res?.data) return;
  const parser = new Parser();
  const json = await parser.parseString(res.data);
  // logToFile(json);
  return json;
}

function getFlag(value: any) {
  if (!value) return '';
  return value.lastBuildDate;
}

/** 判断当前 rss 是否已经更新 */
export function checkRssUpdated({
  feed,
  records,
}: {
  feed: { id: number; value: any };
  records: Record<number, string>;
}): [boolean, string?, string?] {
  if (!feed?.value || !feed?.id || !records) {
    return [false];
  }

  const last = records[feed.id + ''];
  const flag = getFlag(feed.value);
  if (!flag) {
    return [false];
  }
  if (last === undefined || last === '' || flag === last) {
    return [true, flag, last];
  }

  return [false];
}

let innerTasks = [];

export function registerRssTask() {}

/** 获取并更新 RSS 记录 */
export async function fetchUpdatedRssFeeds() {
  if (!RssDbUrl) {
    throw new Error('please set env var: `--rssDbUrl`');
  }
  let promises: Promise<any>[] = [];
  RssList.forEach((x) => {
    if (!x.url) {
      return;
    }
    const p = fetchRssFeed(x);
    promises.push(p);
  });
  const results = await Promise.allSettled(promises);
  // TODO: 有异常的 RSS 要反馈给我
  const feeds = results
    .map((x, i) => ({
      ...x,
      // 从 1 开始记录
      id: i + 1,
    }))
    .filter((x) => x.status === 'fulfilled') as Array<{ id: number; value: any }>;
  if (!feeds?.length) {
    return;
  }
  console.log(feeds);
  const db = new JsonDB();
  await db.connect(RssDbUrl);
  const records = db.read();
  const updatedFeeds = feeds.filter((feed) => {
    const [isUpdated, flag] = checkRssUpdated({ feed, records });
    if (isUpdated) {
      db.merge({ [feed.id]: flag });
    }
    return isUpdated;
  });
  await db.save();
  console.log(updatedFeeds);
  return updatedFeeds;
}

fetchUpdatedRssFeeds();
