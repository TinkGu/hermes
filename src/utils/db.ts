import axios from 'axios';
import { isDeepStrictEqual } from 'util';
// import { logToFile } from '.';

/**
 * json 对象数据库，暂不考虑事务等复杂特性
 * https://jsonstores.com/doc/index.html
 */
export class JsonDB {
  /** 本地缓存对象 */
  private cache: any;
  private raw: any;
  private url: string;
  private connected = false;

  constructor() {
    this.cache = undefined;
    this.raw = undefined;
    this.connected = false;
  }

  private checkConnected = () => {
    if (!this.connected) {
      throw new Error(`json db should be connected!`);
    }
  };

  /** 连接远端数据，同步到本地 */
  connect = async (url: string) => {
    if (!url) {
      throw new Error(`jsdon db missing params [url]`);
    }
    this.cache = undefined;
    this.raw = undefined;
    this.connected = false;
    this.url = url;
    const res = await axios.get(url, { headers: { 'Content-Type': 'application/json' } });
    // if (res?.data) {
    //   logToFile(res.data, { name: 'db' });
    // }
    this.url = url;
    this.cache = Object.assign({}, res.data);
    this.raw = Object.assign({}, res.data);
    this.connected = true;
  };

  /** 读，从本地 */
  read = () => {
    this.checkConnected();
    return this.cache;
  };

  /** 写操作 */
  write = (cb: (x: Object) => Object) => {
    this.checkConnected();
    if (typeof cb === 'function') {
      const res = cb(this.read());
      if (!res) {
        return;
      }

      this.cache = res;
    }
  };

  /** 合并操作 */
  merge = (o: Object) => {
    this.write(() => o);
  };

  /** 保存到远端 */
  save = async () => {
    this.checkConnected();
    const isSame = isDeepStrictEqual(this.raw, this.cache);
    const isEmpty = isDeepStrictEqual(this.cache, {});
    if (isSame || isEmpty) {
      return;
    }
    const isOk = await axios.put(this.url, this.cache);
    return isOk;
  };
}
