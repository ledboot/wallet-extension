import { useState } from 'react';
import { ChevronLeft, ChevronRight, Info, X } from 'lucide-react';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';

export default function PreferencesScreen() {
  const navigate = useNavigate();
  const { currentLanguage, t } = useLanguage();

  const [currency] = useState('USD');
  const [appearance] = useState('Match system');
  const [countNfts, setCountNfts] = useState(false);
  const [hideRisky, setHideRisky] = useState(true);
  const [hideLowValue, setHideLowValue] = useState(true);

  const languages = [
    { code: 'en' as const, name: 'English' },
    { code: 'zh' as const, name: '中文' },
    { code: 'ja' as const, name: '日本語' },
    { code: 'ko' as const, name: '한국어' },
  ];

  const currentLangObj =
    languages.find((l) => l.code === currentLanguage) || languages[0];

  const SettingRow = ({
    label,
    rightContent,
    onClick,
  }: {
    label: string;
    rightContent?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <div
      className='-mx-4 flex cursor-pointer items-center justify-between border-b border-gray-100 px-4 py-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50'
      onClick={onClick}
    >
      <span className='text-[15px] font-semibold text-gray-900 dark:text-gray-100'>
        {label}
      </span>
      <div className='flex items-center text-gray-400 dark:text-gray-500'>
        {rightContent}
        {onClick && <ChevronRight className='ml-1 h-5 w-5' />}
      </div>
    </div>
  );

  const SwitchRow = ({
    label,
    checked,
    onChange,
    info,
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    info?: boolean;
  }) => (
    <div className='-mx-4 flex items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-gray-800'>
      <div className='flex items-center'>
        <span className='text-[15px] font-semibold text-gray-900 dark:text-gray-100'>
          {label}
        </span>
        {info && <Info className='ml-1.5 h-4 w-4 text-gray-400' />}
      </div>
      <label className='relative inline-flex cursor-pointer items-center'>
        <input
          type='checkbox'
          className='peer sr-only'
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:peer-checked:bg-white"></div>
      </label>
    </div>
  );

  return (
    <div className='flex h-[600px] w-full flex-col bg-white pt-14 dark:bg-gray-900'>
      {/* Header */}
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4 dark:border-gray-800 dark:bg-gray-900'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
        >
          <ChevronLeft className='h-5 w-5 text-gray-800 dark:text-gray-200' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-bold text-gray-900 dark:text-white'>
          {t('settings.preferences')}
        </h1>
        <button
          onClick={() => navigate('MainScreen')}
          className='-mr-2 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
        >
          <X className='h-5 w-5 text-gray-800 dark:text-gray-200' />
        </button>
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto px-4 pb-6'>
        <SettingRow
          label={t('settings.currency')}
          rightContent={<span>{currency}</span>}
          onClick={() => {}}
        />
        <SettingRow
          label={t('settings.language')}
          rightContent={<span>{currentLangObj.name}</span>}
          onClick={() => navigate('LanguageScreen')}
        />
        <SettingRow
          label={t('settings.appearance')}
          rightContent={<span>{appearance}</span>}
          onClick={() => {}}
        />
        <SettingRow
          label={t('settings.color_preferences')}
          rightContent={
            <div className='flex items-center text-sm'>
              <span className='mr-1 font-bold text-green-500'>↑</span>
              <span className='font-bold text-pink-500'>↓</span>
            </div>
          }
          onClick={() => {}}
        />
        <SettingRow label={t('settings.default_wallet')} onClick={() => {}} />
        <SettingRow
          label={t('settings.custom_network')}
          onClick={() => navigate('AddCustomNetwork')}
        />

        <div className='mt-2'>
          <SwitchRow
            label={t('settings.count_nfts')}
            info
            checked={countNfts}
            onChange={setCountNfts}
          />
          <SwitchRow
            label={t('settings.hide_risky')}
            checked={hideRisky}
            onChange={setHideRisky}
          />
          <SwitchRow
            label={t('settings.hide_low_value')}
            checked={hideLowValue}
            onChange={setHideLowValue}
          />
        </div>

        <SettingRow
          label={t('settings.set_value_threshold')}
          rightContent={<span>1 USDT</span>}
          onClick={() => {}}
        />
      </div>
    </div>
  );
}
