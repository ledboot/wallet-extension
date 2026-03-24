import { TxHistoryItem, TxHistoryPage, Utxo } from '@/shared/types';

const DB_NAME = 'zent-wallet-db';
const DB_VERSION = 4;
const UTXO_MAP_STORE = 'asset-utxo-map';
const TX_HISTORY_STORE = 'asset-tx-history-map';
const TX_HISTORY_BY_HEIGHT_TIME_INDEX = 'by-address-chain-height-time';
const TX_HISTORY_BY_ADDRESS_CHAIN_INDEX = 'by-address-chain';

type UtxoMap = { [key: string]: Utxo[] };

interface UtxoMapRecord {
  key: string;
  utxos: Utxo[];
}

interface LegacyTxHistoryMapRecord {
  key: string;
  history: TxHistoryItem[];
}

interface TxHistoryCursorPayload {
  blockHeight: number;
  blockTime: number;
  txid: string;
  index: number;
}

interface TxHistoryEntryRecord {
  key: string;
  addressChainKey: string;
  blockHeight: number;
  blockTime: number;
  txid: string;
  index: number;
  item: TxHistoryItem;
}

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(UTXO_MAP_STORE)) {
        db.createObjectStore(UTXO_MAP_STORE, { keyPath: 'key' });
      }

      let txHistoryStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(TX_HISTORY_STORE)) {
        txHistoryStore = db.createObjectStore(TX_HISTORY_STORE, { keyPath: 'key' });
      } else {
        txHistoryStore = request.transaction!.objectStore(TX_HISTORY_STORE);
      }

      if (!txHistoryStore.indexNames.contains(TX_HISTORY_BY_HEIGHT_TIME_INDEX)) {
        txHistoryStore.createIndex(TX_HISTORY_BY_HEIGHT_TIME_INDEX, [
          'addressChainKey',
          'blockHeight',
          'blockTime',
          'txid',
          'index',
        ]);
      }
      if (!txHistoryStore.indexNames.contains(TX_HISTORY_BY_ADDRESS_CHAIN_INDEX)) {
        txHistoryStore.createIndex(TX_HISTORY_BY_ADDRESS_CHAIN_INDEX, 'addressChainKey');
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
};

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('IndexedDB request failed'));
    };
  });
};

const transactionToPromise = (transaction: IDBTransaction): Promise<void> => {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error || new Error('IndexedDB transaction failed'));
    };
    transaction.onabort = () => {
      reject(transaction.error || new Error('IndexedDB transaction aborted'));
    };
  });
};

const getAll = async (): Promise<UtxoMap> => {
  const db = await openDatabase();
  const transaction = db.transaction(UTXO_MAP_STORE, 'readonly');
  const store = transaction.objectStore(UTXO_MAP_STORE);
  const records = await requestToPromise(store.getAll() as IDBRequest<UtxoMapRecord[]>);
  await transactionToPromise(transaction);
  db.close();

  const map: UtxoMap = {};
  for (const record of records) {
    map[record.key] = record.utxos;
  }
  return map;
};

const set = async (key: string, utxos: Utxo[]): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(UTXO_MAP_STORE, 'readwrite');
  const store = transaction.objectStore(UTXO_MAP_STORE);
  store.put({ key, utxos } as UtxoMapRecord);
  await transactionToPromise(transaction);
  db.close();
};

const setMany = async (utxoMap: UtxoMap): Promise<void> => {
  const entries = Object.entries(utxoMap);
  if (entries.length === 0) return;

  const db = await openDatabase();
  const transaction = db.transaction(UTXO_MAP_STORE, 'readwrite');
  const store = transaction.objectStore(UTXO_MAP_STORE);

  for (const [key, utxos] of entries) {
    store.put({ key, utxos } as UtxoMapRecord);
  }

  await transactionToPromise(transaction);
  db.close();
};

const remove = async (key: string): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(UTXO_MAP_STORE, 'readwrite');
  const store = transaction.objectStore(UTXO_MAP_STORE);
  store.delete(key);
  await transactionToPromise(transaction);
  db.close();
};

const clear = async (): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(UTXO_MAP_STORE, 'readwrite');
  const store = transaction.objectStore(UTXO_MAP_STORE);
  store.clear();
  await transactionToPromise(transaction);
  db.close();
};

const toTxHistoryEntryRecord = (addressChainKey: string, item: TxHistoryItem): TxHistoryEntryRecord => {
  const blockHeight = Number(item.blockHeight || 0);
  const blockTime = Number(item.blockTime || 0);
  return {
    key: `${addressChainKey}:${item.txid}:${item.index}`,
    addressChainKey,
    blockHeight,
    blockTime,
    txid: item.txid,
    index: item.index,
    item,
  };
};

const serializeCursor = (payload: TxHistoryCursorPayload): string => {
  return JSON.stringify(payload);
};

const parseCursor = (cursor?: string): TxHistoryCursorPayload | null => {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(cursor) as TxHistoryCursorPayload;
    if (
      typeof parsed.blockHeight === 'number' &&
      typeof parsed.blockTime === 'number' &&
      typeof parsed.txid === 'string' &&
      typeof parsed.index === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const migrateLegacyTxHistoryMapToEntries = async (): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(TX_HISTORY_STORE, 'readwrite');
  const store = transaction.objectStore(TX_HISTORY_STORE);
  const records = await requestToPromise(store.getAll() as IDBRequest<any[]>);

  for (const record of records) {
    const legacyRecord = record as LegacyTxHistoryMapRecord;
    const isLegacy = Array.isArray(legacyRecord?.history) && typeof legacyRecord?.key === 'string';
    if (!isLegacy) continue;

    for (const item of legacyRecord.history) {
      store.put(toTxHistoryEntryRecord(legacyRecord.key, item));
    }
    store.delete(legacyRecord.key);
  }

  await transactionToPromise(transaction);
  db.close();
};

const upsertTxHistoryEntries = async (addressChainKey: string, history: TxHistoryItem[]): Promise<void> => {
  if (history.length === 0) return;

  const db = await openDatabase();
  const transaction = db.transaction(TX_HISTORY_STORE, 'readwrite');
  const store = transaction.objectStore(TX_HISTORY_STORE);
  for (const item of history) {
    store.put(toTxHistoryEntryRecord(addressChainKey, item));
  }
  await transactionToPromise(transaction);
  db.close();
};

const getTxHistoryPage = async (addressChainKey: string, limit = 20, cursor?: string): Promise<TxHistoryPage> => {
  const pageSize = Math.max(1, limit);
  const db = await openDatabase();
  const transaction = db.transaction(TX_HISTORY_STORE, 'readonly');
  const store = transaction.objectStore(TX_HISTORY_STORE);
  const index = store.index(TX_HISTORY_BY_HEIGHT_TIME_INDEX);

  const minKey: [string, number, number, string, number] = [
    addressChainKey,
    0,
    0,
    '',
    Number.MIN_SAFE_INTEGER,
  ];
  const maxKey: [string, number, number, string, number] = [
    addressChainKey,
    Number.MAX_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER,
    '\uffff',
    Number.MAX_SAFE_INTEGER,
  ];

  const parsedCursor = parseCursor(cursor);
  const range = parsedCursor
    ? IDBKeyRange.bound(
        minKey,
        [addressChainKey, parsedCursor.blockHeight, parsedCursor.blockTime, parsedCursor.txid, parsedCursor.index],
        false,
        true
      )
    : IDBKeyRange.bound(minKey, maxKey);

  const request = index.openCursor(range, 'prev');
  const rows: TxHistoryEntryRecord[] = [];

  await new Promise<void>((resolve, reject) => {
    request.onerror = () => {
      reject(request.error || new Error('Failed to load tx history page'));
    };
    request.onsuccess = () => {
      const cursorResult = request.result;
      if (!cursorResult) {
        resolve();
        return;
      }

      rows.push(cursorResult.value as TxHistoryEntryRecord);
      if (rows.length >= pageSize + 1) {
        resolve();
        return;
      }

      cursorResult.continue();
    };
  });

  await transactionToPromise(transaction);
  db.close();

  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
  const last = pageRows.length > 0 ? pageRows[pageRows.length - 1] : null;
  const nextCursor = hasMore && last
    ? serializeCursor({
        blockHeight: last.blockHeight,
        blockTime: last.blockTime,
        txid: last.txid,
        index: last.index,
      })
    : undefined;

  return {
    list: pageRows.map((row) => row.item),
    nextCursor,
    hasMore,
  };
};

const removeTxHistory = async (addressChainKey: string): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(TX_HISTORY_STORE, 'readwrite');
  const store = transaction.objectStore(TX_HISTORY_STORE);
  const index = store.index(TX_HISTORY_BY_ADDRESS_CHAIN_INDEX);
  const request = index.openCursor(IDBKeyRange.only(addressChainKey));

  await new Promise<void>((resolve, reject) => {
    request.onerror = () => {
      reject(request.error || new Error('Failed to remove tx history'));
    };
    request.onsuccess = () => {
      const cursorResult = request.result;
      if (!cursorResult) {
        resolve();
        return;
      }
      cursorResult.delete();
      cursorResult.continue();
    };
  });

  await transactionToPromise(transaction);
  db.close();
};

const removeTxHistoryByAddressPrefix = async (address: string): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(TX_HISTORY_STORE, 'readwrite');
  const store = transaction.objectStore(TX_HISTORY_STORE);
  const index = store.index(TX_HISTORY_BY_ADDRESS_CHAIN_INDEX);
  const range = IDBKeyRange.bound(`${address}_`, `${address}_\uffff`);
  const request = index.openCursor(range);

  await new Promise<void>((resolve, reject) => {
    request.onerror = () => {
      reject(request.error || new Error('Failed to remove tx history by address'));
    };
    request.onsuccess = () => {
      const cursorResult = request.result;
      if (!cursorResult) {
        resolve();
        return;
      }
      cursorResult.delete();
      cursorResult.continue();
    };
  });

  await transactionToPromise(transaction);
  db.close();
};

const clearTxHistory = async (): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(TX_HISTORY_STORE, 'readwrite');
  const store = transaction.objectStore(TX_HISTORY_STORE);
  store.clear();
  await transactionToPromise(transaction);
  db.close();
};

export default {
  getAll,
  set,
  setMany,
  remove,
  clear,
  migrateLegacyTxHistoryMapToEntries,
  upsertTxHistoryEntries,
  getTxHistoryPage,
  removeTxHistory,
  removeTxHistoryByAddressPrefix,
  clearTxHistory,
};
