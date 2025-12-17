import { Utxo, UtxoAddressSumInfo, Coinnames } from '@/shared/types';
import { CHAIN_INFO, KEYRING_TYPE } from '@/shared/constants';
import preferenceService from './preference';
import keyringService from '../service/keyring';

// 工具类：聚合 UTXO，按 address + tokenType + chainId 分组累加 value
export class AssetsList {
  // 静态方法：调用方无需实例化
  static async aggregate(address: string): Promise<UtxoAddressSumInfo[]> {
    
    const currentChainId = CHAIN_INFO[preferenceService.getChainType()].chainId;
    const allUtxos = keyringService.getUTXOs();
    
    // Filter UTXOs to only include those from current addresses
    const utxos = allUtxos.filter(utxo => 
      address === utxo.address
    );
    
    // Create a map to group UTXOs by address and tokenType
    const sumsMap = new Map<string, UtxoAddressSumInfo>();

    for (const utxo of utxos) {
      const key = `${utxo.address}|${utxo.tokenType}`;
      const existingSum = sumsMap.get(key);

      if (existingSum) {
        // If we already have an entry for this address+tokenType, add the value
        existingSum.value = Number(existingSum.value) + Number(utxo.value);
        // Update block info if current UTXO has a higher block height
        if (utxo.blockHeight > existingSum.blockHeight) {
          existingSum.blockHeight = utxo.blockHeight;
          existingSum.blockHash = utxo.blockHash;
        }
      } else {
        // Otherwise create a new entry
        sumsMap.set(key, {
          address: utxo.address,
          tokenType: utxo.tokenType,
          value: Number(utxo.value),
          chainId: currentChainId,
          blockHeight: utxo.blockHeight,
          blockHash: utxo.blockHash
        });
      }
    }

    // Convert map values to array
    const sums = Array.from(sumsMap.values());
    
    // Update the sums in preference service
    keyringService.updateUTXOsum([]);
    keyringService.updateUTXOsum(sums);
    
    return sums;
  }


  static async assetsLists(): Promise<{ assets: Array<UtxoAddressSumInfo & Partial<Coinnames>> }> {

    const existingSums = keyringService.getUTXOsums() || [];
    const existingConames = keyringService.getCoinNames() || [];
    
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
