import { AssetList } from '@/ui/components/AssetList';
import { WalletActions } from '@/ui/components/WalletActions';
import { WalletHeader } from '@/ui/components/WalletHeader';

/**
 * MainScreen
 *
 * 数据刷新策略：
 * - Background 定时轮询最新区块高度，发现差异后写入 store 并
 *   广播 `refreshAssets` 事件。
 * - UI 只负责监听事件被动更新，无需在这里主动 call syncAccountUtxos。
 */
export default function MainScreen() {
  return (
    <div className='flex h-screen flex-col'>
      {/* 固定在顶部的 WalletHeader */}
      <WalletHeader />

      <div className='hide-scrollbar flex-1 overflow-y-auto px-4 pb-4 pt-2'>
        <div className='flex flex-col'>
          {/* WalletActions 区域 */}
          <div className='flex items-center justify-center p-4'>
            <WalletActions />
          </div>

          {/* 资产列表 */}
          <div className='mt-2'>
            <AssetList />
          </div>
        </div>
      </div>
    </div>
  );
}
