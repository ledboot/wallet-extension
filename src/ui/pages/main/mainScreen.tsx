import { WalletActions } from '@/ui/components/WalletActions';
import { WalletHeader } from '@/ui/components/WalletHeader';
import { AssetList } from '@/ui/components/AssetList';
import { useEffect } from 'react';
import { useWallet } from '@/ui/utils/walletContext';
import { useWalletRequest } from '@/ui/utils/hooks';
import { toast } from 'sonner';

export default function MainScreen() {
  const wallet = useWallet();
  const [runUpdate, loading] = useWalletRequest(
    (start: number, limit: number) => wallet.updateInit(start, limit),
    {
      onSuccess: () => toast.success('刷新完成'),
      onError: (e: any) => toast.error(e?.message || '刷新失败'),
    }
  );

  useEffect(() => {
    (async () => {
      const [account, sums] = await Promise.all([
        wallet.getCurrentAccount(),
        wallet.getUtxoSum(),
      ]);
      // console.log('account', account);
      // console.log('sums', sums);
      const latest = (Array.isArray(sums)
        ? sums.find((s) => s.address === account?.address)?.blockHeight
        : 0) || 0;
      runUpdate(0, 2048);
      // runUpdate(latest, 2048);
      console.log('latest', latest);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    // 获取当前最新区块高度并开始同步
    const [account, sums] = await Promise.all([
      wallet.getCurrentAccount(),
      wallet.getUtxoSum(),
    ]);
    const latest = (Array.isArray(sums)
      ? sums.find((s) => s.blockHeight && s.blockHeight > 0)?.blockHeight
      : 0) || 0;
    
    runUpdate(latest, 2048);
  };

  // return (
  //   <div className="h-screen flex flex-col">
  //     {/* 固定在顶部的 WalletHeader */}
  //     <WalletHeader />
      
  //     {/* 可滚动的内容区域 */}
  //     <div className="flex-1 overflow-y-auto hide-scrollbar">
  //       <div className="flex flex-col">
  //         {/* WalletActions 区域 */}
  //         <div className="flex items-center justify-center p-4">
  //           <WalletActions />
  //         </div>
          
  //         {/* AssetList 区域 */}
  //         <AssetList />
  //       </div>
  //     </div>

  //     <div className="p-4 border-t border-gray-200">
  //       <button
  //         className={`w-full py-2 rounded-md text-white ${
  //           loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
  //         }`}
  //         onClick={async () => {
  //           const [account, sums] = await Promise.all([
  //             wallet.getCurrentAccount(),
  //             wallet.getUtxoSum(),
  //           ]);
  //           const latest = (Array.isArray(sums)
  //             ? sums.find((s) => s.address === account?.address)?.blockHeight
  //             : 0) || 0;
  //           runUpdate(latest, 2048);
  //         }}
  //         disabled={loading}
  //       >
  //         {loading ? '刷新中…' : '刷新'}
  //       </button>
  //     </div>
  //   </div>
  // );

  return (
    <div className="h-screen flex flex-col">
      {/* 固定在顶部的 WalletHeader */}
      <WalletHeader onRefresh={handleRefresh} isRefreshing={loading} />
      
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 hide-scrollbar">
        <div className="flex flex-col">
          {/* WalletActions 区域 */}
          <div className="flex items-center justify-center p-4">
            <WalletActions />
          </div>
          
          {/* 资产列表 */}
          <div className="mt-2">
            <AssetList />
          </div>
        </div>
      </div>
    </div>
  );
}