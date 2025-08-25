import { WalletActions } from '@/ui/components/WalletActions';
import { WalletHeader } from '@/ui/components/WalletHeader';
import { AssetList } from '@/ui/components/AssetList';

export default function MainScreen() {
  return (
    <div className="h-screen flex flex-col">
      {/* 固定在顶部的 WalletHeader */}
      <WalletHeader />
      
      {/* 可滚动的内容区域 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="flex flex-col">
          {/* WalletActions 区域 */}
          <div className="flex items-center justify-center p-4">
            <WalletActions />
          </div>
          
          {/* AssetList 区域 */}
          <AssetList />
        </div>
      </div>
    </div>
  );
}