import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, MoreHorizontal } from 'lucide-react';

import { CHAIN_INFO, ChainType } from '@/shared/constants';
import { ChainInfo } from '@/shared/types';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useChainType } from '@/ui/state/hooks';
import { useWallet } from '@/ui/utils';

type Tab = 'rpc' | 'custom';

export default function NetworkSelection() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { t } = useLanguage();
  const currentChainType = useChainType();

  const [activeTab, setActiveTab] = useState<Tab>('rpc');
  const [allChains, setAllChains] = useState<[string, ChainInfo][]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await wallet.getStoredChainInfo();
        setAllChains(Object.entries(stored) as [string, ChainInfo][]);
      } catch {
        setAllChains(Object.entries(CHAIN_INFO) as [string, ChainInfo][]);
      }
    };
    load();
  }, [wallet]);

  const rpcChains = useMemo(
    () => allChains.filter(([, info]) => !info.isCustom),
    [allChains]
  );

  const customChains = useMemo(
    () => allChains.filter(([, info]) => !!info.isCustom),
    [allChains]
  );

  const displayed = activeTab === 'rpc' ? rpcChains : customChains;

  const handleSelect = async (chainType: string) => {
    if (chainType === currentChainType) return;
    try {
      await wallet.changeNetwork(chainType as ChainType);
      navigate('#back');
    } catch (e) {
      console.error('Failed to change network:', e);
    }
  };

  const handleDetail = (key: string, info: ChainInfo) => {
    navigate('NetworkDetailScreen', { chainKey: key, chainInfo: info });
  };

  return (
    <div className='flex h-full w-full flex-col bg-base-100'>
      {/* Fixed Header */}
      <div className='fixed left-0 right-0 top-0 z-10 border-b border-base-300 bg-base-100'>
        <div className='flex items-center px-4 py-3'>
          <button
            className='flex items-center rounded p-1 hover:bg-gray-100'
            onClick={() => navigate('#back')}
          >
            <ArrowLeft className='h-6 w-6' />
          </button>
          <div className='flex-1 text-center text-lg font-semibold'>
            {t('network.select_network')}
          </div>
          {/* spacer to keep title centered */}
          <div className='w-8' />
        </div>

        {/* Tabs */}
        <div className='flex border-b border-base-300 px-4'>
          {(['rpc', 'custom'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`mr-6 pb-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-black text-black dark:border-white dark:text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'rpc' ? 'RPC' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* List – offset for header (~96px) */}
      <div className='flex-1 overflow-y-auto' style={{ paddingTop: '96px' }}>
        {displayed.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-gray-400'>
            <div className='mb-3 text-4xl'>🌐</div>
            <div className='text-sm'>{t('network.no_custom_networks')}</div>
          </div>
        ) : (
          displayed.map(([key, info]) => {
            const isActive = currentChainType === key;
            const rpcUrl = info.endpoints?.[0] ?? '';

            return (
              <div
                key={key}
                className='flex cursor-pointer items-center px-4 py-3 hover:bg-gray-50 active:bg-gray-100'
                onClick={() => handleSelect(key)}
              >
                {/* Icon */}
                <div className='mr-3 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100'>
                  <img
                    src={info.icon}
                    alt={info.label}
                    className='h-7 w-7 object-contain'
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Name + RPC URL */}
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-sm font-medium'>{info.label}</span>
                    {isActive && (
                      <Check className='h-3.5 w-3.5 shrink-0 text-primary' />
                    )}
                  </div>
                  {rpcUrl ? (
                    <div className='mt-0.5 truncate text-xs text-gray-400'>
                      {rpcUrl}
                    </div>
                  ) : null}
                </div>

                {/* Detail button */}
                <button
                  className='ml-2 shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDetail(key, info);
                  }}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </button>
              </div>
            );
          })
        )}

        {/* Add network – Custom tab only, compact */}
        {activeTab === 'custom' && (
          <div className='px-4 py-3'>
            <button
              onClick={() => navigate('AddCustomNetwork')}
              className='w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
            >
              {t('network.add_custom_network')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
