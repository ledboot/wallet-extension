import { useMemo } from 'react';
import { ArrowLeft,Check } from 'lucide-react';

import { CHAIN_INFO, ChainType } from '@/shared/constants';
import { useNavigate } from '@/ui/pages/mainRoute';
import { ChainInfo } from '@/shared/types';
import { useChainType } from '@/ui/state/hooks';
import { useWallet } from '@/ui/utils';

export default function NetworkSelection() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const currentChainType = useChainType();

  const chains = useMemo(
    () => Object.entries(CHAIN_INFO) as [ChainType, ChainInfo][],
    []
  );

  const handleChangeNetwork = async (chainType: ChainType) => {
    if (chainType === currentChainType) return;
    
    try {
      await wallet.changeNetwork(chainType);
      // 网络切换成功后返回上一页
      navigate('#back');
    } catch (error) {
      console.error('Failed to change network:', error);
    }
  };

  return (
    <div className='h-full w-full bg-base-100'>
      {/* Header */}
      <div className='fixed left-0 right-0 top-0 h-14 border-b border-base-300 bg-base-100'>
        <div className='flex items-center px-4 py-3 justify-between'>
          <div
            className='flex cursor-pointer items-center'
            onClick={() => navigate('#back')}
          >
            <ArrowLeft className='h-7 w-7 rounded p-1 hover:bg-gray-100' />
          </div>
          <div className='text-lg font-semibold'>选择网络</div>
          <div className='w-7' />
        </div>
      </div>

      {/* List */}
      <div className='flex-1 pt-14 overflow-y-auto'>
        {chains.map(([key, info]) => (
          <div key={key} className='cursor-pointer px-4 py-3 hover:bg-gray-50' onClick={() => handleChangeNetwork(key)}>
            <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                    <img className='h-8 w-8' src={info.icon} alt={info.iconLabel} />
                    <div className='ml-2 text-base font-medium'>{info.label}</div>
                </div>
                {currentChainType === key && <Check className="h-4 w-4 text-primary" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
