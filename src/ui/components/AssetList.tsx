import { Wallet } from 'lucide-react';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useActiveAssets, useActiveChainName, useAssetsLoading } from '@/ui/state/hooks';

export function AssetList() {
  const { t } = useLanguage();

  const assets = useActiveAssets();
  const chainName = useActiveChainName();
  const loading = useAssetsLoading();

  console.log('AssetList render:', { assets, chainName, loading });

  if (loading) {
    return <div className='p-4 text-center'>{t('assets.loading')}</div>;
  }

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      <div className='hide-scrollbar flex-1 overflow-y-auto px-4 pb-4 pt-2'>
        <div className='mt-2'>
          <div className='space-y-3'>
            {assets.length === 0 ? (
              <div className='flex h-64 flex-col items-center justify-center p-4 text-center'>
                <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50'>
                  <Wallet className='h-8 w-8 text-gray-400' />
                </div>
                <div className='mb-2 text-lg font-medium text-gray-900'>{t('assets.no_tokens_found')}</div>
                <div className='text-sm text-gray-500'>{t('assets.no_tokens_description')}</div>
              </div>
            ) : (
              assets.map((asset) => (
                <div
                  key={asset.tokenType}
                  className='cursor-pointer rounded-2xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 active:bg-gray-200'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white'>
                        <img
                          src={asset.iconHtml}
                          alt={asset.name || t('assets.token_icon')}
                          className='h-full w-full object-cover'
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/default-token.png';
                          }}
                        />
                      </div>
                      <div>
                        <div className='text-base font-semibold text-gray-900'>{asset.name}</div>
                        <div className='text-xs font-medium text-gray-500'>{chainName}</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-base font-semibold text-gray-900'>{(asset.value / 1e8).toFixed(8)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
