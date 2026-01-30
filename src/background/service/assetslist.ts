import { Utxo, UtxoAddressSumInfo, CoinNames } from '@/shared/types';
import { CHAIN_INFO, KEYRING_TYPE, ChainType } from '@/shared/constants';
import preferenceService from './preference';
import keyringService from '../service/keyring';

// 辅助函数：根据 chainId 获取链的显示名称
function getChainLabel(chainId: number): string {
  const chainEntry = Object.entries(CHAIN_INFO).find(
    ([_, info]) => info.chainId === chainId
  );
  return chainEntry ? chainEntry[1].iconLabel : 'Unknown Chain';
}

// 工具类：聚合 UTXO，按 address + tokenType + chainId 分组累加 value
export class AssetsList {
  // 静态方法：调用方无需实例化
  static async aggregate(address: string): Promise<UtxoAddressSumInfo[]> {
    
    // 获取当前网络配置
    const currentChainType = preferenceService.getChainType();
    let currentChainId: number;
    
    // 优先从 CHAIN_INFO 获取，如果没有则从存储获取
    if (CHAIN_INFO[currentChainType]) {
      currentChainId = CHAIN_INFO[currentChainType].chainId;
    } else {
      const storedChainInfo = preferenceService.getchainInfo(currentChainType);
      if (storedChainInfo) {
        currentChainId = storedChainInfo.chainId;
      } else {
        throw new Error(`Chain info not found for: ${currentChainType}`);
      }
    }
    
    const allUtxos = keyringService.getUtxos();
    
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
    
    keyringService.updateUtxoSum(sums);
    
    return sums;
  }


  static async assetsLists(): Promise<{ assets: Array<UtxoAddressSumInfo & Partial<CoinNames> & { chainLabel: string }> }> {

    const existingSums = keyringService.getUtxoSum() || [];
    const existingConames = keyringService.getCoinNames() || [];
    
     // Create a map of tokenType to Coinname for quick lookup
    const coinnameMap = new Map(
        existingConames.map(coin => [coin.tokenType, coin])
    );

    // Filter and map existingSums to include matching CoinNames and chain label
    const mergedAssets = existingSums.map(sum => {
        const coinInfo = coinnameMap.get(sum.tokenType);
        return {
            ...sum,
            ...(coinInfo || {}),
            chainId: sum.chainId,
            chainLabel: getChainLabel(sum.chainId)
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
