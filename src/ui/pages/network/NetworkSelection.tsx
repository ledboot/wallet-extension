import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Globe, MoreHorizontal } from 'lucide-react';

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

  const rpcChains = useMemo(() => allChains.filter(([, info]) => !info.isCustom), [allChains]);

  const customChains = useMemo(() => allChains.filter(([, info]) => !!info.isCustom), [allChains]);

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
    <div className='flex h-full w-full flex-col bg-white'>
      {/* Fixed Header */}
      <div className='absolute left-0 top-0 z-10 flex w-full flex-col bg-white'>
        <div className='flex items-center justify-between px-4 py-3'>
          <button
            onClick={() => navigate('#back')}
            className='-ml-2 flex flex-shrink-0 items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
          >
            <ArrowLeft className='h-5 w-5 text-gray-800' />
          </button>
          <div className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
            {t('network.select_network')}
          </div>
          <div className='h-9 w-9 shrink-0' />
        </div>

        {/* Tabs - iOS Segment Control Style */}
        <div className='px-4 pb-3 pt-1'>
          <div className='flex h-10 w-full rounded-2xl bg-gray-100 p-1'>
            {(['rpc', 'custom'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'rpc' ? 'RPC' : 'Custom'}
              </button>
            ))}
          </div>
        </div>
        <div className='h-[1px] w-full bg-gray-100' />
      </div>

      {/* List Content */}
      <div className='hide-scrollbar flex-1 overflow-y-auto bg-white px-4 pb-6 pt-[116px]'>
        {displayed.length === 0 ? (
          <div className='flex h-64 flex-col items-center justify-center text-gray-400'>
            <Globe className='mb-3 h-12 w-12 opacity-50' />
            <div className='text-sm text-gray-500'>{t('network.no_custom_networks')}</div>
          </div>
        ) : (
          <div className='flex flex-col space-y-3 pt-2'>
            {displayed.map(([key, info]) => {
              const isActive = currentChainType === key;
              const rpcUrl = info.endpoints?.[0] ?? '';

              return (
                <div
                  key={key}
                  className={`flex cursor-pointer items-center rounded-2xl p-4 transition-colors ${
                    isActive ? 'bg-gray-100/80 ring-1 ring-gray-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelect(key)}
                >
                  {/* Icon */}
                  <div className='mr-4 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-gray-100'>
                    <img
                      src={info.icon || '/public/images/default-chain.svg'}
                      alt={info.label}
                      className='h-10 w-10 object-contain'
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/public/images/default-chain.svg';
                      }}
                    />
                  </div>

                  {/* Name + RPC URL */}
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='truncate text-base font-semibold text-gray-900'>{info.label}</span>
                    </div>
                    {rpcUrl ? <div className='mt-1 truncate text-xs font-medium text-gray-500'>{rpcUrl}</div> : null}
                  </div>

                  {isActive && (
                    <div className='ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900'>
                      <Check className='h-3.5 w-3.5 text-white' />
                    </div>
                  )}

                  {/* Detail button */}
                  <button
                    className='ml-3 flex shrink-0 items-center justify-center rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900 focus:outline-none'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDetail(key, info);
                    }}
                  >
                    <MoreHorizontal className='h-5 w-5' />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add network button */}
        {activeTab === 'custom' && (
          <div className='mt-6 pb-2'>
            <button
              onClick={() => navigate('AddCustomNetwork')}
              className='w-full rounded-full bg-gray-900 py-4 text-sm font-medium text-white transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2'
            >
              {t('network.add_custom_network')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
