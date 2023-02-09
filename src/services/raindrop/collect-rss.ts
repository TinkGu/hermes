import { Output } from 'rss-parser';
import { RssFeedWorkflow } from '../../utils/rss';
import { COLLECTIONS } from './config';
import { postRaindrops, RaindropAddItem } from './services';

/** 采集 RSS 源进入到 raindrop 中 */
export const collectRssToInbox: RssFeedWorkflow = async (feeds) => {
  let news: Output<any>[] = [];
  feeds.forEach((x) => {
    if (x.news?.length) {
      news = news.concat(x.news);
    }
  });

  if (!news?.length) {
    return;
  }

  const fmtItems: RaindropAddItem[] = news
    .filter((x) => !!x.link)
    .map((x) => {
      return {
        collectionId: COLLECTIONS.inbox,
        link: x.link!,
        tags: ['rss'],
      };
    });
  await postRaindrops(fmtItems);
};
