import { X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const AccountSelection = () => {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState(0);
  
  const accounts = [
    { name: "Account 1", address: "0x742d35Cc6C4165C8503e2C0f1C220b4c4e8b6C8F" },
    { name: "Account 2", address: "0x1A2B3C4D5E6F7890ABCDEF1234567890ABCDEF12" },
    { name: "Account 3", address: "0x9876543210FEDCBA0987654321FEDCBA09876543" },
  ];

  const handleAccountSelect = (index: number) => {
    setSelectedAccount(index);
    // Here you would typically save the selected account to state/context
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm bg-base-100 border border-base-300 shadow-lg overflow-hidden">
        {/* Header with close button */}
        <div className="card-body p-4 border-b border-base-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">选择账号</h2>
            <button
              className="btn btn-ghost btn-sm h-8 w-8 p-0"
              onClick={() => navigate("/")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Account list */}
        <div className="card-body p-4 space-y-3">
          {accounts.map((account, index) => (
            <button
              key={index}
              onClick={() => handleAccountSelect(index)}
              className="w-full p-3 rounded-lg border border-base-300 hover:bg-base-200 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-content">
                      {account.name.charAt(account.name.length - 1)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{account.name}</div>
                    <div className="text-xs text-base-content/60">
                      {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                    </div>
                  </div>
                </div>
                {selectedAccount === index && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountSelection;