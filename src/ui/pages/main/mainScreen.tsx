import { WalletActions } from '@/ui/components/WalletActions';
import { WalletHeader } from '@/ui/components/WalletHeader';
import { WalletBalance } from '@/ui/components/WalletBalance';
import { AssetList } from '@/ui/components/AssetList';
import { TransactionHistory } from '@/ui/components/TransactionHistory';

export default function MainScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Wallet Extension Container */}
        <WalletHeader />
        <WalletBalance />
        <WalletActions />
        <AssetList />
        <TransactionHistory />
    </div>
  );
}