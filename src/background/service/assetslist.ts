import { Utxo, UtxoAddressSumInfo, Coinnames } from '@/shared/types';
import { CHAIN_INFO } from '@/shared/constants';
import preferenceService from './preference';
import keyringService from './keyring';

// 工具类：聚合 UTXO，按 address + tokenType + chainId 分组累加 value
export class AssetsList {
  // 静态方法：调用方无需实例化
  static aggregate(...utxos: Utxo[]): UtxoAddressSumInfo[] {
    const map = new Map<string, UtxoAddressSumInfo>();
    const currentChainId = CHAIN_INFO[preferenceService.getChainType()].chainId;

    const existingSums = preferenceService.getUtxoSums() || [];
    const existingSumsMap = new Map(
      existingSums.map(sum => [`${sum.address}|${sum.tokenType}`, sum])
    );

    for (const u of utxos) {
      const key = `${u.address}|${u.tokenType}`;
      const existingSum = existingSumsMap.get(key);
      if (existingSum) {
        existingSum.value += Number(u.value || 0);
        if (typeof u.blockHeight === 'number' && 
          (existingSum.blockHeight === undefined || u.blockHeight > existingSum.blockHeight)) {
          existingSum.blockHeight = u.blockHeight;
          existingSum.blockHash = u.blockHash;
        }
      } else {
        map.set(key, {
          address: u.address,
          tokenType: u.tokenType,
          chainId: currentChainId,
          value: Number(u.value || 0),
          blockHeight: u.blockHeight,
          blockHash: u.blockHash,
        });
      }
    }

    const sums = Array.from(map.values());
    preferenceService.setUtxoSums(sums);
    return sums;
  }


  static assetsLists(): { assets: Array<UtxoAddressSumInfo & Partial<Coinnames>> } {

    const existingSums = preferenceService.getUtxoSums() || [];
    const existingConames = preferenceService.getConames() || [];
    
     // Create a map of tokenType to Coinname for quick lookup
    const coinnameMap = new Map(
        existingConames.map(coin => [coin.tokenType, coin])
    );

    // Filter and map existingSums to include matching coinnames
    // Merge data where tokenType matches
    const mergedAssets = existingSums.map(sum => {
        const coinInfo = coinnameMap.get(sum.tokenType);
        return {
            ...sum,
            ...(coinInfo || {})
        };
    });

    console.log('Merged assets:', mergedAssets);
    return { assets: mergedAssets };
  }
    
  // 将聚合结果写入 keyringService.loadStore 初始化的 ObservableStore（即 keyringState）
  // static aggregateToLoadStore(...utxos: Utxo[]): UtxoAddressSumInfo[] {
  //   const sums = AssetsList.aggregate(...utxos);
  //   const prev = keyringService.store?.getState?.() || {};
  //   // 合并写入，保持其他字段不变
  //   keyringService.store.updateState({
  //     ...prev,
  //     utxoSums: sums,
  //   });
  //   return sums;
  // }
}

export default AssetsList;
