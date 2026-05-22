import { useEffect, useState } from 'react';
import { Account } from '@shared/types';
import { Check, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { getApprovalId } from '@/ui/utils';

import { capturePostHogEvent } from '@/shared/telemetry/posthog';
import { PixelAvatar } from '@/ui/components/PixelAvatar';
import { useKeyringsList } from '@/ui/state/hooks';
import { useWallet } from '@/ui/utils/walletContext';
import ApprovalLayout from './ApprovalLayout';

const ApprovalConnect = () => {
  const id = getApprovalId();
  const wallet = useWallet();
  const keyringsList = useKeyringsList();

  const [request, setRequest] = useState<any>(null);
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([]);
  const [view, setView] = useState<'main' | 'select'>('main');

  useEffect(() => {
    const init = async () => {
      if (id && selectedAddresses.length === 0) {
        try {
          const currentAcc = await wallet.getCurrentAccount();
          if (currentAcc?.address) {
            setSelectedAddresses([currentAcc.address]);
          }
        } catch (e) {
          // ignore, might still be locked
        }
      }
    };
    init();
  }, [id, wallet, selectedAddresses.length, keyringsList]);

  const selectAddress = (address: string) => {
    setSelectedAddresses([address]);
    setView('main');
  };

  const handleConnect = async () => {
    if (id && selectedAddresses.length > 0) {
      capturePostHogEvent('approval_connect_approved', {
        selected_count: selectedAddresses.length,
      });
      await wallet.resolveApproval(id, selectedAddresses);
    }
  };

  const handleCancel = async () => {
    if (id) {
      capturePostHogEvent('approval_connect_rejected');
      await wallet.rejectApproval(id);
    }
  };

  const selectedAccount = keyringsList
    .flatMap((kr) => kr.accounts)
    .find((acc) => selectedAddresses.includes(acc.address));

  return (
    <ApprovalLayout id={id} onInit={setRequest}>
      {view === 'select' ? (
        <div className="flex flex-col h-screen bg-white text-gray-900 overflow-hidden">
          <div className="flex items-center h-16 px-4 border-b border-gray-100">
            <button 
              onClick={() => setView('main')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="flex-1 text-center font-bold text-lg mr-10">Select account</h1>
          </div>
  
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 hide-scrollbar">
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Connect one account</p>
            </div>
            
            {keyringsList.map((kr) => (
              <div key={kr.key} className="space-y-1 mb-6">
                <p className="text-[10px] font-bold text-gray-400 ml-1 opacity-60 uppercase tracking-widest mb-2">
                  {kr.alianName}
                </p>
                {kr.accounts.map((account: Account) => {
                  const isSelected = selectedAddresses.includes(account.address);
                  return (
                    <button
                      key={account.address}
                      onClick={() => selectAddress(account.address)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border ${
                        isSelected 
                          ? 'bg-gray-50 border-gray-100' 
                          : 'bg-white border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="shrink-0 rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-gray-100">
                          <PixelAvatar seed={account.address} size={36} borderRadius={10} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-900">
                            {account.alianName}
                          </p>
                          <p className="text-xs font-medium text-gray-400">
                            {`${account.address.slice(0, 10)}...${account.address.slice(-8)}`}
                          </p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                        isSelected 
                          ? 'bg-gray-900 border-gray-900' 
                          : 'border-gray-200'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white font-bold" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
  
          <div className="p-6 border-t border-gray-100">
            <button
              onClick={() => setView('main')}
              className="w-full py-4 rounded-full text-sm font-bold text-white bg-gray-900 hover:bg-black transition-colors"
            >
              Confirm selection
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen bg-white text-gray-900 overflow-hidden">
          <div className="flex items-center justify-center h-16 border-b border-gray-50">
               <h1 className="text-lg font-bold">Connect account</h1>
          </div>
    
          <div className="flex-1 flex flex-col px-6">
            <div className="flex items-center py-8 space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
                    {request?.icon ? (
                        <img src={request.icon} alt={request.name} className="w-10 h-10 object-contain" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                    )}
                </div>
                <div className="min-w-0">
                    <h1 className="text-3xl font-bold tracking-tight truncate">{request?.name}</h1>
                    <p className="text-sm text-gray-400 font-medium truncate">{request?.origin}</p>
                </div>
            </div>
    
            <div className="h-px bg-gray-100 w-full mb-6" />
    
            <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account used</p>
                
                <button 
                    onClick={() => setView('select')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-transparent hover:bg-gray-50 transition-colors group"
                >
                    <div className="flex flex-col text-left space-y-1">
                        {selectedAccount ? (
                            <>
                                <div className="text-sm text-gray-900">
                                    {selectedAccount.address.slice(0, 8)}...{selectedAccount.address.slice(-8)}
                                </div>
                                 <div className="mt-1">
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                                        {selectedAccount.alianName}
                                    </span>
                                 </div>
                            </>
                        ) : (
                            <p className="text-sm font-bold text-red-500">No account selected</p>
                        )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                </button>
            </div>
          </div>
    
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center space-x-3 mb-6 px-1">
              <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200">
                 <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-[11px] leading-relaxed text-gray-500 font-semibold">
                Allow this DApp to connect with your wallet.
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleCancel}
                className="flex-1 py-4 px-6 rounded-full text-sm font-bold text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={selectedAddresses.length === 0}
                className="flex-1 py-4 px-6 rounded-full text-sm font-bold text-white bg-gray-900 hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-30 disabled:shadow-none"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </ApprovalLayout>
  );
};

export default ApprovalConnect;
