import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWallet } from '@/ui/utils/walletContext';
import { ShieldCheck } from 'lucide-react';
import ApprovalLayout from './ApprovalLayout';

const ApprovalSwitchNetwork = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const wallet = useWallet();
  const [request, setRequest] = useState<any>(null);

  const handleApprove = async () => {
    if (id) {
      await wallet.resolveApproval(id, true);
    }
  };

  const handleReject = async () => {
    if (id) {
      await wallet.rejectApproval(id);
    }
  };

  return (
    <ApprovalLayout id={id} onInit={setRequest}>
      <div className="flex flex-col h-screen bg-white text-gray-900 overflow-hidden">
        <div className="flex items-center justify-center h-16 border-b border-gray-50">
          <h1 className="text-lg font-bold">Switch network</h1>
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Request details</p>
            <div className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-600">
                Allow <span className="font-bold text-gray-900">{request?.name}</span> to switch the network to:
              </p>
              <div className="mt-3 flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                <span className="text-sm font-bold text-gray-900">
                  {request?.params?.name || `Chain ID: ${request?.params?.chainId}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center space-x-3 mb-6 px-1">
            <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className="text-[11px] leading-relaxed text-gray-500 font-semibold">
              The DApp will be able to read data and send requests to the new network.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleReject}
              className="flex-1 py-4 px-6 rounded-full text-sm font-bold text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 py-4 px-6 rounded-full text-sm font-bold text-white bg-gray-900 hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              Switch
            </button>
          </div>
        </div>
      </div>
    </ApprovalLayout>
  );
};

export default ApprovalSwitchNetwork;
