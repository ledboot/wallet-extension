import { useEffect, useRef, useState } from 'react';
import { Wallet } from 'lucide-react';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useActiveAssets, useActiveChainName, useAssetsLoading } from '@/ui/state/hooks';
import TokenIcon from '@/ui/components/TokenIcon';

const SATOSHI_FACTOR = 1e8;

const formatAssetAmount = (value: number): string => {
  return (value / SATOSHI_FACTOR).toFixed(8);
};

function AnimatedAssetAmount({ value }: { value: number }) {
  const durationMs = 450;
  const [displayValue, setDisplayValue] = useState<number>(value);
  const targetRef = useRef<number>(value);

  useEffect(() => {
    if (targetRef.current === value) return;

    const startValue = targetRef.current;
    const endValue = value;
    targetRef.current = value;
    const startTs = performance.now();

    let raf = 0;
    const step = (ts: number) => {
      const progress = Math.min((ts - startTs) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = startValue + (endValue - startValue) * eased;
      setDisplayValue(next);

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className='tabular-nums'>{formatAssetAmount(displayValue)}</span>;
}

export function AssetList() {
  const { t } = useLanguage();

  const assets = useActiveAssets();
  const chainName = useActiveChainName();
  const loading = useAssetsLoading();

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
                        <TokenIcon
                          src={asset.iconHtml}
                          alt={asset.name || t('assets.token_icon')}
                          className='h-full w-full rounded-full'
                        />
                      </div>
                      <div>
                        <div className='text-base font-semibold text-gray-900'>{asset.name}</div>
                        <div className='text-xs font-medium text-gray-500'>{chainName}</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-base font-semibold text-gray-900'>
                        <AnimatedAssetAmount value={asset.value} />
                      </div>
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
