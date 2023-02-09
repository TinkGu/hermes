/**
 * see API DOC
 * https://developer.raindrop.io/v1/raindrops/multiple
 *
 */
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { getArg } from '../../utils';

const raindropToken = getArg('raindropToken');

/** Raindrop 文章详情 */
export interface RaindropArticle {
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

/** Raindrop 文章新增 结构体 */
export interface RaindropAddItem {
  pleaseParse?: boolean;
  tags?: string[];
  link: string;
  collectionId?: number;
}

/** 封装 raindrop oauth */
export async function request(opts: AxiosRequestConfig<any> & { log?: boolean }) {
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
export async function getCollection({ id }: { id: number }) {
  const data = await request({
    method: 'get',
    url: `https://api.raindrop.io/rest/v1/collection/${id}`,
  });

  return data?.item;
}

/** 根据集合 id，获取 raindrop 文章列表 */
export async function getRaindrops({ id }: { id: number }) {
  const data = await request({
    method: 'get',
    url: `https://api.raindrop.io/rest/v1/raindrops/${id}`,
    params: {
      page: 0,
      perpage: 10,
    },
  });

  return data?.items || [];
}

/** 批量新增，限制最多 100 个 */
export async function rawPostRaindrops(items: RaindropAddItem[], options?: Partial<RaindropAddItem>) {
  const fmtItems = items.map((raw) => {
    const x: any = {
      ...raw,
      ...(options || {}),
    };
    x.pleaseParse = x.pleaseParse === false ? undefined : {};
    x.collection = x.collectionId
      ? {
          $id: x.collectionId,
        }
      : undefined;
    delete x.collectionId;
    return x;
  });
  return await request({
    url: 'https://api.raindrop.io/rest/v1/raindrops',
    method: 'post',
    data: {
      items: fmtItems,
    },
  });
}

function slice<T>(arr: T[], step: number) {
  let len = arr?.length;
  let start = 0;
  if (len <= step) {
    return [arr];
  }
  const res: T[][] = [];
  while (start < len) {
    res.push(arr.slice(start, start + step));
    start += step;
  }
  return res;
}

/** 批量新增，无限制（自动拆分请求） */
export async function postRaindrops(items: RaindropAddItem[], options?: Partial<RaindropAddItem>) {
  // 最多上传 100 条，需要分批推送
  const postTask: Promise<any>[] = [];
  const newsChunks = slice(items, 100);

  newsChunks.forEach((x) => {
    if (!x?.length) {
      return;
    }
    postTask.push(rawPostRaindrops(x, options));
  });

  await Promise.allSettled(postTask);
}