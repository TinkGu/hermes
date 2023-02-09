import '../../utils/env';
import { COLLECTIONS } from './config';
import { getRaindrops, moveRaindrops } from './services';

/** 从 inbox 文件夹中，移动一篇文章到 tomorrow 文件夹 */
async function roamFeedsToTomorrow() {
  try {
    const items = await getRaindrops({ id: COLLECTIONS.inbox });
    const first = items?.[0]?._id;
    if (!first) {
      return;
    }
    await moveRaindrops({
      fromColId: COLLECTIONS.inbox,
      toColId: COLLECTIONS.tomorrow,
      ids: [first],
    });
  } catch (err) {
    // TODO: 失败报警
  }
}

/** 从 tomorrow 文件夹中，移动过期文章到 hangup 文件夹 */
function roamFeedsToHungup() {
  try {
  } catch (err) {
    // TODO: 失败报警
  }
}

/** 文章自动生命周期流转 */
function roamFeeds() {
  roamFeedsToTomorrow();
  roamFeedsToHungup();
}

roamFeeds();
