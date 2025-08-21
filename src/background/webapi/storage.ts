import { browserStorageLocalGet, browserStorageLocalSet } from './browser';

let cacheMap: Map<string, unknown> | undefined;

const get = async (prop?: any) => {
  if (cacheMap) {
    return cacheMap.get(prop);
  }

  const result = await browserStorageLocalGet(null);
  cacheMap = new Map(Object.entries(result).map(([k, v]) => [k, v]));

  return prop ? result[prop] : result;
};

const set = async (prop: string, value: any): Promise<void> => {
  await browserStorageLocalSet({ [prop]: value });
  cacheMap?.set(prop, value);
};

const byteInUse = async (): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (chrome) {
      chrome.storage.local.getBytesInUse((value) => {
        resolve(value);
      });
    } else {
      reject('ByteInUse only works in Chrome');
    }
  });
};

export default {
  get,
  set,
  byteInUse,
};
