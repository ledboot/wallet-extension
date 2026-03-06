import { useEffect, useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { useLocation } from 'react-router';

import { NetworkType } from '@/shared/constants';
import { ChainInfo } from '@/shared/types';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useWallet } from '@/ui/utils';

export interface NetworkDetailState {
  chainKey: string;
  chainInfo: ChainInfo;
}

export default function NetworkDetailScreen() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { t } = useLanguage();
  const location = useLocation();
  const state = location.state as NetworkDetailState;

  const { chainKey, chainInfo } = state || {};

  // 从 chainInfo.isCustom 字段判断，无需路由额外传参
  const isCustom = !!chainInfo?.isCustom;

  const [name, setName] = useState(chainInfo?.label ?? '');
  const [rpcUrl, setRpcUrl] = useState(chainInfo?.endpoints?.[0] ?? '');
  const [chainId, setChainId] = useState(String(chainInfo?.chainId ?? ''));
  const [symbol, setSymbol] = useState(chainInfo?.iconLabel ?? '');
  const [explorerUrl, setExplorerUrl] = useState(chainInfo?.explorerUrl ?? '');
  const [isTestnet, setIsTestnet] = useState(
    chainInfo?.networkType === NetworkType.TESTNET
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!chainInfo) navigate('#back');
  }, [chainInfo, navigate]);

  if (!chainInfo) return null;

  const isFormValid =
    name.trim() !== '' &&
    rpcUrl.trim() !== '' &&
    chainId.trim() !== '' &&
    symbol.trim() !== '';

  const handleSave = async () => {
    if (!isFormValid || saving) return;
    setSaving(true);
    try {
      const updated: ChainInfo = {
        ...chainInfo,
        label: name.trim(),
        iconLabel: symbol.trim(),
        chainId: parseInt(chainId, 10) || chainInfo.chainId,
        endpoints: [rpcUrl.trim()],
        explorerUrl: explorerUrl.trim() || undefined,
        networkType: isTestnet ? NetworkType.TESTNET : NetworkType.MAINNET,
        updated: Math.floor(Date.now() / 1000),
        isCustom: true,
      };
      await wallet.addchainInfo(chainKey, updated);
      navigate('#back');
    } catch (e) {
      console.error('Failed to save network:', e);
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChange?: (v: string) => void,
    placeholder = '',
    showInfo = false
  ) => (
    <div>
      <label className='mb-2 flex items-center text-sm font-semibold text-gray-900'>
        {label}
        {showInfo && <Info className='ml-1.5 h-4 w-4 text-gray-400' />}
      </label>
      <input
        type='text'
        readOnly={!isCustom}
        className={`w-full rounded-xl px-4 py-3.5 text-sm outline-none ${
          isCustom
            ? 'bg-gray-50 text-gray-900 placeholder:text-gray-400'
            : 'cursor-default select-all bg-gray-100 text-gray-500'
        }`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );

  return (
    <div className='flex h-full w-full flex-col overflow-y-auto bg-white'>
      {/* Header */}
      <div className='flex items-center px-4 py-4'>
        <button
          onClick={() => navigate('#back')}
          className='rounded p-1 transition-colors hover:bg-gray-100'
        >
          <ArrowLeft className='h-6 w-6 text-gray-800' />
        </button>
      </div>

      {/* Network icon + name */}
      <div className='mb-6 flex flex-col items-center px-4'>
        <div className='mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-100'>
          <img
            src={chainInfo.icon}
            alt={chainInfo.label}
            className='h-10 w-10 object-contain'
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <h1 className='text-xl font-bold text-gray-900'>{chainInfo.label}</h1>
      </div>

      {/* Fields */}
      <div className='flex-1 space-y-5 px-4'>
        {field(
          t('network.network_name'),
          name,
          isCustom ? setName : undefined,
          'e.g., Ethereum'
        )}
        {field(
          t('network.rpc_url'),
          rpcUrl,
          isCustom ? setRpcUrl : undefined,
          'https://...'
        )}
        {field(
          t('network.chain_id'),
          chainId,
          isCustom ? (v) => setChainId(v) : undefined,
          '0',
          true
        )}
        {field(
          t('network.symbol'),
          symbol,
          isCustom ? setSymbol : undefined,
          'e.g., ETH'
        )}
        {field(
          t('network.block_explorer_url_optional'),
          explorerUrl,
          isCustom ? setExplorerUrl : undefined,
          'https://...'
        )}

        {/* Testnet toggle – only for custom */}
        {isCustom && (
          <div className='flex items-center space-x-2 pt-2'>
            <label className='relative inline-flex cursor-pointer items-center'>
              <input
                type='checkbox'
                className='peer sr-only'
                checked={isTestnet}
                onChange={(e) => setIsTestnet(e.target.checked)}
              />
              <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
            </label>
            <span className='text-sm font-semibold text-gray-900'>
              {t('network.is_test_network')}
            </span>
          </div>
        )}
      </div>

      {/* Save button – custom only */}
      {isCustom && (
        <div className='px-4 py-3'>
          <button
            onClick={handleSave}
            disabled={!isFormValid || saving}
            className={`w-full rounded-xl border py-2.5 text-sm font-medium transition-colors ${
              isFormValid && !saving
                ? 'border-gray-800 text-gray-800 hover:bg-gray-50'
                : 'cursor-not-allowed border-gray-200 text-gray-400'
            }`}
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      )}
    </div>
  );
}
