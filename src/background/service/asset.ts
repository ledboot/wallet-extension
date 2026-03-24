import { CHAIN_INFO, NetworkType } from '@/shared/constants';
import { CoinNames, TransferAddressHistory, TxHistoryItem, TxHistoryPage, Utxo, UtxoAddressSumInfo } from '@/shared/types';

import createPersistStore from '../utils/persisitStore';
import { indexedDB as indexedDbStorage, storage } from '../webapi';
import preferenceService from './preference';

interface AssetStore {
  utxoSum: UtxoAddressSumInfo[];
  coinName: CoinNames[];
  transferAddressHistory: TransferAddressHistory[];
  syncBlockHeightMap: { [key: string]: number }; // key: "address_chainId_networkType"
}

type UtxoMap = { [key: string]: Utxo[] };
type LegacyAssetStore = AssetStore & { utxoMap?: UtxoMap };

class AssetService {
  store!: AssetStore;
  private utxoMap: UtxoMap = {};
  private readonly template: AssetStore = {
    utxoSum: [],
    coinName: [],
    transferAddressHistory: [],
    syncBlockHeightMap: {},
  };

  private getAddressChainKey = (address: string, chainId: number): string => `${address}_${chainId}`;

  private getCurrentChainId = (): number => {
    const chainInfo = preferenceService.getCurrentChainInfo();
    return chainInfo ? chainInfo.chainId : 0;
  };

  private getResolvedChainId = (chainId?: number): number => {
    return typeof chainId === 'number' ? chainId : this.getCurrentChainId();
  };

  private sortUtxosByValueDesc = (utxos: Utxo[]): Utxo[] => {
    return [...utxos].sort((a, b) => {
      const va = BigInt(a.value);
      const vb = BigInt(b.value);
      if (va > vb) return -1;
      if (va < vb) return 1;
      return 0;
    });
  };

  private hydrateUtxoMapFromIndexedDB = async () => {
    this.utxoMap = await indexedDbStorage.getAll();
  };

  private migrateLegacyUtxoMap = async () => {
    const legacyStore = this.store as LegacyAssetStore;
    const legacyUtxoMap = legacyStore.utxoMap;

    if (legacyUtxoMap && Object.keys(legacyUtxoMap).length > 0) {
      await indexedDbStorage.setMany(legacyUtxoMap);
    }

    if ('utxoMap' in legacyStore) {
      delete legacyStore.utxoMap;
    }
  };

  private replaceUtxoSumForAddressChain = (address: string, chainId: number, sums: UtxoAddressSumInfo[]) => {
    const rest = this.getUtxoSum().filter((item) => !(item.address === address && item.chainId === chainId));
    this.store.utxoSum = [...rest, ...sums];
  };

  private persistAssetStateNow = async () => {
    await storage.set('assetState', {
      utxoSum: this.store.utxoSum || [],
      coinName: this.store.coinName || [],
      transferAddressHistory: this.store.transferAddressHistory || [],
      syncBlockHeightMap: this.store.syncBlockHeightMap || {},
    });
  };

  init = async () => {
    this.store = await createPersistStore<AssetStore>({
      name: 'assetState',
      template: this.template,
    });

    await this.migrateLegacyUtxoMap();
    await this.hydrateUtxoMapFromIndexedDB();
    await indexedDbStorage.migrateLegacyTxHistoryMapToEntries();
  };

  /**
   * 清空资产缓存并重置持久化存储。
   */
  clearStore = async () => {
    this.store.utxoSum = [];
    this.store.coinName = [];
    this.store.transferAddressHistory = [];
    this.store.syncBlockHeightMap = {};
    this.utxoMap = {};

    await indexedDbStorage.clear();
    await indexedDbStorage.clearTxHistory();
    // 立即覆盖存储，避免旧缓存被 debounce 的持久化覆盖
    await storage.set('assetState', { ...this.template });
  };

  // ─── UTXO Map (IndexedDB) ──────────────────────────────────────────────

  getUtxos = (): Utxo[] => {
    return Object.values(this.utxoMap || {}).flat();
  };

  getUtxosByChain = (chainId: number): Utxo[] => {
    const keySuffix = `_${chainId}`;
    return Object.entries(this.utxoMap || {})
      .filter(([key]) => key.endsWith(keySuffix))
      .flatMap(([, value]) => value);
  };

  getUtxosByAddress = (address: string, chainId?: number): Utxo[] => {
    const resolvedChainId = this.getResolvedChainId(chainId);
    const utxos = this.getUtxosMap(address, resolvedChainId);
    return this.sortUtxosByValueDesc(utxos);
  };

  setUtxosMap = async (address: string, chainId: number, utxos: Utxo[]) => {
    const key = this.getAddressChainKey(address, chainId);
    const map = new Map<string, Utxo>();
    for (const utxo of utxos) {
      map.set(`${utxo.txid}:${utxo.index}`, utxo);
    }
    const normalizedUtxos = [...map.values()];

    this.utxoMap = { ...this.utxoMap, [key]: normalizedUtxos };
    await indexedDbStorage.set(key, normalizedUtxos);
  };

  addUtxosMap = async (address: string, chainId: number, utxos: Utxo[]) => {
    const key = this.getAddressChainKey(address, chainId);
    const existing = this.utxoMap[key] || [];
    const map = new Map(existing.map((u) => [`${u.txid}:${u.index}`, u]));
    for (const u of utxos) {
      map.set(`${u.txid}:${u.index}`, u);
    }
    const merged = [...map.values()];

    this.utxoMap = { ...this.utxoMap, [key]: merged };
    await indexedDbStorage.set(key, merged);
  };

  getUtxosMap = (address: string, chainId: number): Utxo[] => {
    return this.utxoMap[this.getAddressChainKey(address, chainId)] || [];
  };

  getUtxosAllMap = (): UtxoMap => {
    return this.utxoMap || {};
  };

  removeUtxo = async (rmTxid: string, rmIndex: number) => {
    const nextMap: UtxoMap = {};
    const changedKeys: string[] = [];

    for (const [key, utxos] of Object.entries(this.utxoMap || {})) {
      const filtered = utxos.filter(({ txid, index }) => !(txid === rmTxid && index === rmIndex));
      nextMap[key] = filtered;
      if (filtered.length !== utxos.length) {
        changedKeys.push(key);
      }
    }

    this.utxoMap = nextMap;
    await Promise.all(changedKeys.map((key) => indexedDbStorage.set(key, this.utxoMap[key] || [])));
  };

  clearUtxos = async () => {
    this.utxoMap = {};
    await indexedDbStorage.clear();
  };

  // ─── Tx History (IndexedDB) ───────────────────────────────────────────

  mergeTxHistoryMap = async (address: string, chainId: number, txHistory: TxHistoryItem[]) => {
    if (txHistory.length === 0) return;

    const key = this.getAddressChainKey(address, chainId);
    const map = new Map<string, TxHistoryItem>();
    for (const item of txHistory) {
      map.set(`${item.txid}:${item.index}`, item);
    }
    await indexedDbStorage.upsertTxHistoryEntries(key, [...map.values()]);
  };

  getTxHistory = async (address: string, chainId: number, limit = 20, cursor?: string): Promise<TxHistoryPage> => {
    const key = this.getAddressChainKey(address, chainId);
    return indexedDbStorage.getTxHistoryPage(key, limit, cursor);
  };

  // ─── UTXO Sum ─────────────────────────────────────────────────────────

  updateUtxoSum = (newSums: UtxoAddressSumInfo[]) => {
    const existing = this.getUtxoSum();
    const map = new Map(existing.map((u) => [`${u.address}:${u.chainId}:${u.tokenType}`, u]));
    for (const u of newSums) {
      map.set(`${u.address}:${u.chainId}:${u.tokenType}`, u);
    }
    this.store.utxoSum = [...map.values()];
  };

  getUtxoSum = (address?: string, chainId?: number): UtxoAddressSumInfo[] => {
    const all = this.store.utxoSum || [];
    if (!address && !chainId) return all;
    return all.filter((s) => {
      const addrMatch = !address || s.address === address;
      const chainMatch = !chainId || s.chainId === chainId;
      return addrMatch && chainMatch;
    });
  };

  removeUtxoSum = (rmAddress: string, rmChainId: number) => {
    this.store.utxoSum = this.getUtxoSum().filter(
      ({ address, chainId }) => !(address === rmAddress && chainId === rmChainId)
    );
  };

  // ─── Account / Keyring UTXO cleanup ──────────────────────────────────

  removeAccountUtxoData = async (address: string) => {
    // utxoSum
    this.store.utxoSum = this.getUtxoSum().filter((s) => s.address !== address);

    // syncBlockHeightMap
    const nextSyncBlockHeightMap: { [key: string]: number } = {};
    for (const [key, value] of Object.entries(this.store.syncBlockHeightMap || {})) {
      if (!key.startsWith(`${address}_`)) {
        nextSyncBlockHeightMap[key] = value;
      }
    }
    this.store.syncBlockHeightMap = nextSyncBlockHeightMap;

    // utxoMap (IndexedDB)
    const targetKeys = Object.keys(this.utxoMap || {}).filter((key) => key.startsWith(`${address}_`));
    const nextMap: UtxoMap = { ...this.utxoMap };
    for (const key of targetKeys) {
      delete nextMap[key];
    }
    this.utxoMap = nextMap;

    await Promise.all(targetKeys.map((key) => indexedDbStorage.remove(key)));
    await indexedDbStorage.removeTxHistoryByAddressPrefix(address);
    await this.persistAssetStateNow();
  };

  // ─── CoinNames ────────────────────────────────────────────────────────

  addCoinName = (coinNames: CoinNames[]) => {
    this.store.coinName = coinNames;
  };

  getCoinNames = (tokenType?: string): CoinNames[] => {
    const all = this.store.coinName || [];
    if (!tokenType) return all;
    return all.filter((c) => c.tokenType === tokenType);
  };

  removeCoinName = (rmTokenType: string, rmChainId: number) => {
    this.store.coinName = this.getCoinNames().filter(
      ({ tokenType, chainId }) => !(tokenType === rmTokenType && chainId === rmChainId)
    );
  };

  // ─── Transfer Address History ─────────────────────────────────────────

  updateTransferAddressesHistory = (newAddressHistory: TransferAddressHistory[]) => {
    const existing = this.getTransferAddressHistory();
    const map = new Map(existing.map((u) => [u.address, u]));
    for (const u of newAddressHistory) {
      map.set(u.address, u);
    }
    this.store.transferAddressHistory = [...map.values()];
  };

  getTransferAddressHistory = (): TransferAddressHistory[] => {
    return this.store.transferAddressHistory || [];
  };

  // ─── Sync Block Height ────────────────────────────────────────────────

  getSyncBlockHeight = (address: string, chainId: number, networkType: NetworkType): number => {
    const key = `${address}_${chainId}_${networkType}`;
    return this.store.syncBlockHeightMap?.[key] || 0;
  };

  setSyncBlockHeight = (address: string, chainId: number, networkType: NetworkType, height: number) => {
    const key = `${address}_${chainId}_${networkType}`;
    const current = this.store.syncBlockHeightMap || {};
    this.store.syncBlockHeightMap = { ...current, [key]: height };
  };

  // ─── Aggregation / Display ─────────────────────────────────────────────

  /**
   * 按 address + tokenType 聚合 UTXOs，写入 utxoSum 并返回结果。
   */
  aggregateUtxoSums = (address: string, chainId: number): UtxoAddressSumInfo[] => {
    const utxos = this.getUtxosMap(address, chainId);
    const sumsMap = new Map<string, UtxoAddressSumInfo>();

    for (const utxo of utxos) {
      const key = `${utxo.address}|${utxo.tokenType}`;
      const existing = sumsMap.get(key);
      if (existing) {
        existing.value = Number(existing.value) + Number(utxo.value);
        if (utxo.blockHeight > existing.blockHeight) {
          existing.blockHeight = utxo.blockHeight;
          existing.blockHash = utxo.blockHash;
        }
      } else {
        sumsMap.set(key, {
          address: utxo.address,
          tokenType: utxo.tokenType,
          value: Number(utxo.value),
          chainId,
          blockHeight: utxo.blockHeight,
          blockHash: utxo.blockHash,
        });
      }
    }

    const sums = Array.from(sumsMap.values());
    this.replaceUtxoSumForAddressChain(address, chainId, sums);
    return sums;
  };

  /**
   * 获取当前账户的资产列表（utxoSum 合并 coinNames），供 UI 直接展示。
   */
  getAssetsPage = (address: string): Array<UtxoAddressSumInfo & Partial<CoinNames> & { chainLabel: string }> => {
    const existingSums = this.getUtxoSum().filter((s) => s.address === address);
    const coinNamesMap = new Map(this.getCoinNames().map((coin) => [`${coin.chainId}:${coin.tokenType}`, coin]));

    return existingSums.map((sum) => {
      const coinInfo = coinNamesMap.get(`${sum.chainId}:${sum.tokenType}`) ?? this.getCoinNames(sum.tokenType)[0];
      const chainEntry = Object.entries(CHAIN_INFO).find(([, info]) => info.chainId === sum.chainId);
      const chainLabel = chainEntry ? chainEntry[1].iconLabel : 'Unknown Chain';
      return { ...sum, ...(coinInfo || {}), chainId: sum.chainId, chainLabel };
    });
  };
}

export default new AssetService();
