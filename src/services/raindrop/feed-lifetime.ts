import '../../utils/env';
import { COLLECTIONS } from './config';
import { deleteRaindrops, getRaindrops, moveRaindrops, RaindropArticle } from './services';

/** 从 inbox 文件夹中，移动一篇文章到 tomorrow 文件夹 */
export async function roamFeedsToTomorrow() {
  try {
    const items = await getRaindrops({ id: COLLECTIONS.inbox });
    const first = items?.[0]?._id;
    if (!first) {
      return;
    }
    return await moveRaindrops({
      fromColId: COLLECTIONS.inbox,
      toColId: COLLECTIONS.tomorrow,
      ids: [first],
    });
  } catch (err) {
    console.error(err);
    // TODO: 失败报警
  }
}

/** 从 tomorrow 文件夹中，移动过期文章（30 天）到 hangup 文件夹 */
export async function roamFeedsToHungup() {
  try {
    const items = await getRaindrops({ id: COLLECTIONS.tomorrow, sort: 'created' });
    const now = Date.now().valueOf();
    const expiredOffset = 30 * 86400000;
    const overdated = items
      .filter((x) => {
        const createdTime = new Date(x.created).valueOf();
        return now - createdTime > expiredOffset;
      })
      .map((x) => x._id);
    if (!overdated?.length) {
      return;
    }
    return await moveRaindrops({
      fromColId: COLLECTIONS.tomorrow,
      toColId: COLLECTIONS.hangup,
      ids: overdated,
    });
  } catch (err) {
    console.error(err);
    // TODO: 失败报警
  }
}

/** 从 hangup 文件夹中，移动过期文章（30 天）到垃圾桶 */
export async function roamFeedsToTrash() {
  try {
    const items = await getRaindrops({ id: COLLECTIONS.hangup, sort: 'created' });
    const now = Date.now().valueOf();
    const tipOffset = 15 * 86400000;
    const expiredOffset = 20 * 86400000;
    let tipItems: RaindropArticle[] = [];
    const overdated = items
      .filter((x) => {
        const updatedTime = new Date(x.lastUpdate).valueOf();
        if (now - updatedTime > tipOffset) {
          tipItems.push(x);
        }
        return now - updatedTime > expiredOffset;
      })
      .map((x) => x._id);

    if (overdated?.length) {
      await deleteRaindrops({
        colId: COLLECTIONS.hangup,
        ids: overdated,
      });
    }
    const msg = ['---', '💀 💀 💀', '---', `有 ${tipItems?.length} 篇文章将被删除`].join('\n\n');
    return tipItems?.length ? msg : '';
  } catch (err) {
    console.error(err);
    // TODO: 失败报警
  }
}
