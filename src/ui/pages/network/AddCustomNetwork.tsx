import { useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';

import { NetworkType } from '@/shared/constants';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useWallet } from '@/ui/utils';

export default function AddCustomNetwork() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { t } = useLanguage();

  const [networkName, setNetworkName] = useState('');
  const [rpcUrl, setRpcUrl] = useState('');
  const [chainId, setChainId] = useState('');
  const [symbol, setSymbol] = useState('');
  const [blockExplorerUrl, setBlockExplorerUrl] = useState('');
  const [isTestnet, setIsTestnet] = useState(false);

  const isFormValid =
    networkName.trim() !== '' &&
    rpcUrl.trim() !== '' &&
    chainId.trim() !== '' &&
    symbol.trim() !== '';

  const handleSave = async () => {
    if (!isFormValid) return;

    try {
      const parsedChainId = parseInt(chainId, 10) || 0;

      const newChainInfo = {
        label: networkName.trim(),
        iconLabel: symbol.trim(),
        chainId: parsedChainId,
        endpoints: [rpcUrl.trim()],
        icon: './images/artifacts/bitcoin-mainnet.svg',
        unit: symbol.trim(),
        networkType: isTestnet ? NetworkType.TESTNET : NetworkType.MAINNET,
        updated: Math.floor(Date.now() / 1000),
        id: parsedChainId || Date.now() % 100000,
        explorerUrl: blockExplorerUrl.trim() || undefined,
        isCustom: true,
      };

      // Generate a unique chainType key
      const chainTypeKey = `CUSTOM_NETWORK_${networkName.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`;

      await wallet.addchainInfo(chainTypeKey, newChainInfo);

      // Navigate back after saving
      navigate('#back');
    } catch (error) {
      console.error('Failed to add custom network:', error);
    }
  };

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      {/* Top Navigation Header */}
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <ArrowLeft className='h-5 w-5 text-gray-800' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
          {t('network.add_custom_network')}
        </h1>
        <div className='h-9 w-9'></div>
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto bg-white px-4 pb-6 pt-20'>
        {/* Alert Warning */}
        <div className='mb-6 flex items-start rounded-2xl bg-orange-50 p-4'>
          <div className='mr-3 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-500'>
            <span className='text-xs font-bold text-white'>!</span>
          </div>
          <p className='text-sm leading-relaxed text-orange-700'>
            {t('network.add_network_warning')}
          </p>
        </div>

        {/* Form Fields */}
        <div className='space-y-4 rounded-2xl bg-white'>
          <div>
            <label className='mb-2 block text-sm font-semibold text-gray-900'>
              {t('network.network_name')}
            </label>
            <input
              type='text'
              className='w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-gray-300'
              placeholder='e.g., Ethereum'
              value={networkName}
              onChange={(e) => setNetworkName(e.target.value)}
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-semibold text-gray-900'>
              {t('network.rpc_url')}
            </label>
            <input
              type='text'
              className='w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-gray-300'
              placeholder='e.g. https://etc.rivet.link'
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
            />
          </div>

          <div>
            <label className='mb-2 flex items-center text-sm font-semibold text-gray-900'>
              {t('network.chain_id')}
              <Info className='ml-1.5 h-4 w-4 text-gray-400' />
            </label>
            <input
              type='text'
              className='w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-gray-300'
              placeholder='e.g., 0'
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-semibold text-gray-900'>
              {t('network.symbol')}
            </label>
            <input
              type='text'
              className='w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-gray-300'
              placeholder='e.g., ETH'
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-semibold text-gray-900'>
              {t('network.block_explorer_url_optional')}
            </label>
            <input
              type='text'
              className='w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-gray-300'
              placeholder='e.g., https://ethereum.org'
              value={blockExplorerUrl}
              onChange={(e) => setBlockExplorerUrl(e.target.value)}
            />
          </div>

          <div className='flex items-center space-x-3 pt-2'>
            <label className='relative inline-flex cursor-pointer items-center'>
              <input
                type='checkbox'
                className='peer sr-only'
                checked={isTestnet}
                onChange={(e) => setIsTestnet(e.target.checked)}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] focus:outline-none peer-checked:bg-gray-900 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
            <span className='text-sm font-semibold text-gray-900'>
              {t('network.is_test_network')}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className='bg-white px-4 py-6'>
        <button
          onClick={handleSave}
          disabled={!isFormValid}
          className={`w-full rounded-full py-4 text-sm font-medium transition-colors
            ${
              isFormValid
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'cursor-not-allowed bg-gray-100 text-gray-400'
            }
          `}
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
