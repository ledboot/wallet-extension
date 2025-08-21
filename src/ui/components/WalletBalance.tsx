import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function WalletBalance() {
  const [showBalance, setShowBalance] = useState(true);
  const balance = "12.45678";
  const usdValue = "31,234.56";

  return (
    <div className="p-6 text-center w-full">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <h2 className="text-sm text-muted-foreground">Total Balance</h2>
        <button 
          className="btn btn-ghost btn-sm h-auto p-1"
          onClick={() => setShowBalance(!showBalance)}
        >
          {showBalance ? (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Eye className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
      
      {showBalance ? (
        <div className="space-y-1">
          <div className="text-3xl font-bold bg-wallet-balance bg-clip-text text-transparent">
            {balance} ETH
          </div>
          <div className="text-lg text-muted-foreground">
            ${usdValue} USD
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-3xl font-bold text-muted-foreground">
            ••••••••
          </div>
          <div className="text-lg text-muted-foreground">
            ••••••••
          </div>
        </div>
      )}
    </div>
  );
}