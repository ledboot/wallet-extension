import React, { useState } from 'react';
import { capturePostHogEvent } from '@/shared/telemetry/posthog';
import { getApprovalId } from '@/ui/utils';
import { useWallet } from '@/ui/utils/walletContext';
import { ShieldCheck } from 'lucide-react';
import ApprovalLayout from './ApprovalLayout';

const ApprovalSignTransaction = () => {
  const id = getApprovalId();
  const wallet = useWallet();
  const [request, setRequest] = useState<any>(null);

  const handleApprove = async () => {
    if (id) {
      capturePostHogEvent('approval_sign_transaction_approved');
      await wallet.resolveApproval(id, true);
    }
  };

  const handleReject = async () => {
    if (id) {
      capturePostHogEvent('approval_sign_transaction_rejected');
      await wallet.rejectApproval(id);
    }
  };

  return (
    <ApprovalLayout id={id} onInit={setRequest}>
      <div className="flex flex-col h-screen bg-white text-gray-900 overflow-hidden">
        <div className="flex items-center justify-center h-16 border-b border-gray-50">
          <h1 className="text-lg font-bold">Sign Transaction</h1>
        </div>

        <div className="flex-1 flex flex-col px-6 overflow-hidden">
          <div className="flex items-center py-6 space-x-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
              {request?.icon ? (
                <img src={request.icon} alt={request.name} className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate">{request?.name}</h1>
              <p className="text-xs text-gray-400 font-medium truncate">{request?.origin}</p>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full mb-4 shrink-0" />

          <div className="flex-1 flex flex-col min-h-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 shrink-0">Transaction data</p>
            <div className="flex-1 w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 overflow-y-auto mb-4">
              <pre className="text-[11px] font-mono whitespace-pre-wrap break-all text-gray-600">
                {JSON.stringify(request?.params?.tx, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 shrink-0">
          <div className="flex items-center space-x-3 mb-6 px-1">
            <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className="text-[11px] leading-relaxed text-gray-500 font-semibold">
              Signing this will authorize the transaction to be sent to the network.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleReject}
              className="flex-1 py-4 px-6 rounded-full text-sm font-bold text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 py-4 px-6 rounded-full text-sm font-bold text-white bg-gray-900 hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              Sign
            </button>
          </div>
        </div>
      </div>
    </ApprovalLayout>
  );
};

export default ApprovalSignTransaction;
