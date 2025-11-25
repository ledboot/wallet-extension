import { utxoType, utxoAddressSumInfo } from '@/shared/types';
import { CHAIN_INFO } from '@/shared/constants';
import preferenceService from './preference';
import keyringService from './keyring';

// 工具类：聚合 UTXO，按 address + tokenType + chainId 分组累加 value
export class AssetsList {
  // 静态方法：调用方无需实例化
  static aggregate(...utxos: utxoType[]): utxoAddressSumInfo[] {
    const map = new Map<string, utxoAddressSumInfo>();
    const currentChainId = CHAIN_INFO[preferenceService.getChainType()].chainId;

    for (const u of utxos) {
      const key = `${u.address}|${u.tokenType}`;
      const curr = map.get(key);
      if (curr) {
        curr.value += Number(u.value || 0);
        if (
          typeof curr.blockHeight !== 'number' ||
          (typeof u.blockHeight === 'number' && u.blockHeight >= curr.blockHeight)
        ) {
          curr.blockHeight = u.blockHeight;
          curr.blockHash = u.blockHash;
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

    return Array.from(map.values());
  }

  // 将聚合结果写入 keyringService.loadStore 初始化的 ObservableStore（即 keyringState）
  static aggregateToLoadStore(...utxos: utxoType[]): utxoAddressSumInfo[] {
    const sums = AssetsList.aggregate(...utxos);
    const prev = keyringService.store?.getState?.() || {};
    // 合并写入，保持其他字段不变
    keyringService.store.updateState({
      ...prev,
      utxoSums: sums,
    });
    return sums;
  }
}

export default AssetsList;
