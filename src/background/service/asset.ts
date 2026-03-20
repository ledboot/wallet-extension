import { CHAIN_INFO, NetworkType } from '@/shared/constants';
import { CoinNames, transferAddressHistory, Utxo, UtxoAddressSumInfo } from '@/shared/types';

import createPersistStore from '../utils/persisitStore';
import { storage } from '../webapi';
import preferenceService from './preference';

interface AssetStore {
  utxos: Utxo[];
  utxoSum: UtxoAddressSumInfo[];
  utxoMap: { [key: string]: Utxo[] }; // key: "address_chainId"
  coinName: CoinNames[];
  transferAddressHistory: transferAddressHistory[];
  syncBlockHeightMap: { [key: string]: number }; // key: "address_chainId_networkType"
}

class AssetService {
  store!: AssetStore;
  private readonly template: AssetStore = {
    utxos: [],
    utxoSum: [],
    utxoMap: {},
    coinName: [],
    transferAddressHistory: [],
    syncBlockHeightMap: {},
  };

  init = async () => {
    this.store = await createPersistStore<AssetStore>({
      name: 'assetState',
      template: this.template,
    });
  };

  /**
   * 清空资产缓存并重置持久化存储。
   */
  clearStore = async () => {
    this.store.utxos = [];
    this.store.utxoSum = [];
    this.store.utxoMap = {};
    this.store.coinName = [];
    this.store.transferAddressHistory = [];
    this.store.syncBlockHeightMap = {};

    // 立即覆盖存储，避免旧缓存被 debounce 的持久化覆盖
    await storage.set('assetState', { ...this.template });
  };

  // ─── UTXOs ───────────────────────────────────────────────────────────

  /** 批量合并 UTXOs（按 txid:index 去重） */
  updateUtxos = (newUtxos: Utxo[]) => {
    const utxos = this.getUtxos();
    const map = new Map(utxos.map((u) => [`${u.txid}:${u.index}`, u]));
    for (const u of newUtxos) {
      map.set(`${u.txid}:${u.index}`, u);
    }
    this.store.utxos = [...map.values()];
  };

  getUtxos = (): Utxo[] => this.store.utxos || [];

  getUtxosByAddress = (address: string): Utxo[] => {
    const utxos = (this.store.utxos || []).filter((u) => u.address === address);
    utxos.sort((a, b) => {
      const va = BigInt(a.value);
      const vb = BigInt(b.value);
      if (va > vb) return -1;
      if (va < vb) return 1;
      return 0;
    });
    return utxos;
  };

  removeUtxo = (rmTxid: string, rmIndex: number) => {
    this.store.utxos = this.getUtxos().filter(({ txid, index }) => !(txid === rmTxid && index === rmIndex));
  };

  clearUtxos = () => {
    this.store.utxos = [];
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

  // ─── UTXO Map ─────────────────────────────────────────────────────────

  addUtxosMap = (address: string, chainId: number, utxos: Utxo[]) => {
    const key = `${address}_${chainId}`;
    const current = this.store.utxoMap || {};
    const existing = current[key] || [];
    const map = new Map(existing.map((u: Utxo) => [`${u.txid}:${u.index}`, u]));
    for (const u of utxos) {
      map.set(`${u.txid}:${u.index}`, u);
    }
    this.store.utxoMap = { ...current, [key]: [...map.values()] };
  };

  getUtxosMap = (address: string, chainId: number): Utxo[] => {
    return this.store.utxoMap?.[`${address}_${chainId}`] || [];
  };

  getUtxosAllMap = (): { [key: string]: Utxo[] } => {
    return this.store.utxoMap || {};
  };

  // ─── Account / Keyring UTXO cleanup ──────────────────────────────────

  removeAccountUtxoData = (address: string) => {
    // utxos array
    this.store.utxos = this.getUtxos().filter((u) => u.address !== address);

    // utxoSum
    this.store.utxoSum = this.getUtxoSum().filter((s) => s.address !== address);

    // utxoMap
    const newMap: { [key: string]: Utxo[] } = {};
    for (const [key, value] of Object.entries(this.store.utxoMap || {})) {
      if (!key.startsWith(`${address}_`)) {
        newMap[key] = value;
      }
    }
    this.store.utxoMap = newMap;
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

  updateTransferAddressesHistory = (newAddressHistory: transferAddressHistory[]) => {
    const existing = this.getTransferAddressHistory();
    const map = new Map(existing.map((u) => [u.address, u]));
    for (const u of newAddressHistory) {
      map.set(u.address, u);
    }
    this.store.transferAddressHistory = [...map.values()];
  };

  getTransferAddressHistory = (): transferAddressHistory[] => {
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
  aggregateUtxoSums = (address: string): UtxoAddressSumInfo[] => {
    const chainInfo = preferenceService.getCurrentChainInfo();
    const currentChainId = chainInfo.chainId;

    const utxos = this.getUtxos().filter((u) => u.address === address);
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
          chainId: currentChainId,
          blockHeight: utxo.blockHeight,
          blockHash: utxo.blockHash,
        });
      }
    }

    const sums = Array.from(sumsMap.values());
    this.updateUtxoSum(sums);
    return sums;
  };

  /**
   * 获取当前账户的资产列表（utxoSum 合并 coinNames），供 UI 直接展示。
   */
  getAssetsPage = (address: string): Array<UtxoAddressSumInfo & Partial<CoinNames> & { chainLabel: string }> => {
    const existingSums = this.getUtxoSum().filter((s) => s.address === address);
    const coinNamesMap = new Map(this.getCoinNames().map((coin) => [coin.tokenType, coin]));

    return existingSums.map((sum) => {
      const coinInfo = coinNamesMap.get(sum.tokenType);
      const chainEntry = Object.entries(CHAIN_INFO).find(([, info]) => info.chainId === sum.chainId);
      const chainLabel = chainEntry ? chainEntry[1].iconLabel : 'Unknown Chain';
      return { ...sum, ...(coinInfo || {}), chainId: sum.chainId, chainLabel };
    });
  };
}

export default new AssetService();
