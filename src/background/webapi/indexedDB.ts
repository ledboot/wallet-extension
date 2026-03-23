import { Utxo } from '@/shared/types';

const DB_NAME = 'zent-wallet-db';
const DB_VERSION = 1;
const UTXO_MAP_STORE = 'asset-utxo-map';

type UtxoMap = { [key: string]: Utxo[] };

interface UtxoMapRecord {
  key: string;
  utxos: Utxo[];
}

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(UTXO_MAP_STORE)) {
        db.createObjectStore(UTXO_MAP_STORE, { keyPath: 'key' });
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

export default {
  getAll,
  set,
  setMany,
  remove,
  clear,
};
