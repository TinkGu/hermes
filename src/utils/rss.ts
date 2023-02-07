import Parser, { Output } from 'rss-parser';
import axios from 'axios';
import { getArg, logToFile } from '.';
import { JsonDB } from './db';
import { RssList, RssRule } from '../configs/rss-list';

const RssDbUrl = getArg('rssDbUrl')!;

export interface RssFeed {
  id: number;
  value: Output<any>;
  rule: RssRule;
  news: any[];
}

export type RssFeedWorkflow = (feeds: RssFeed[]) => any;
export interface RssFeedWorkflowConfig {
  workflow: RssFeedWorkflow;
  name: string;
}

/** 获取 rss 内容 */
export async function fetchRssFeed(rule: RssRule) {
  if (!rule?.url) return;
  const res = await axios.get(rule.url, { timeout: 60000 });
  if (!res?.data) return;
  const parser = new Parser();
  const json = await parser.parseString(res.data);
  logToFile(json);
  return json;
}

function getFlag(f: RssFeed, item?: any) {
  let _item = item || f?.value?.items?.[0];
  if (!_item) return '';
  const key = f.rule?.flag || 'pubDate';
  return _item[key];
}

/** 判断当前 rss 是否已经更新 */
export function checkRssUpdated({ feed, records }: { feed: RssFeed; records: Record<number, string> }): [boolean, string?, string?] {
  if (!feed?.value || !feed?.id || !records) {
    return [false];
  }

  const last = records[feed.id + ''];
  const flag = getFlag(feed);
  if (!flag) {
    return [false];
  }
  if (last === undefined || last === '' || flag !== last) {
    return [true, flag, last];
  }

  return [false];
}

/** 获取上次以来更新的文章 */
function getFeedNewItems(feed: RssFeed, flag: string) {
  let res: any[] = [];
  feed.value?.items?.some((item) => {
    const _flag = getFlag(feed, item);
    const isLastBegin = _flag === flag;
    if (!isLastBegin) {
      res.push(item);
    }
    return isLastBegin;
  });
  console.log('res', res);
  return res;
}

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
      rule: RssList[i],
      news: [],
    }))
    .filter((x) => x.status === 'fulfilled') as RssFeed[];
  if (!feeds?.length) {
    return;
  }
  console.log('all-feeds', feeds);
  const db = new JsonDB();
  await db.connect(RssDbUrl);
  const records = db.read();
  const updatedFeeds = feeds.filter((feed) => {
    const [isUpdated, flag] = checkRssUpdated({ feed, records });
    if (isUpdated) {
      feed.news = getFeedNewItems(feed, flag!);
      db.merge({ [feed.id]: flag });
    }
    return isUpdated;
  });
  await db.save();
  return updatedFeeds;
}

let innerTasks = [] as Array<RssFeedWorkflowConfig>;

/** 注册 RSS 推送任务 */
export function registerRssWorkflow(name: string, workflow: RssFeedWorkflow) {
  const task = {
    name,
    workflow,
  };
  innerTasks.push(task);
}

/** 获取变更的 RSS 源，并推送到其它任务流中 */
export async function kickRssFlow() {
  if (!innerTasks.length) {
    return;
  }

  const feeds = await fetchUpdatedRssFeeds();
  console.log('updated-feeds', feeds);
  if (!feeds?.length) {
    return;
  }

  innerTasks.forEach((task) => {
    try {
      task.workflow(feeds);
    } catch (err) {
      console.error(`task failed: ${task?.name || ''} `, err);
    }
  });
}
