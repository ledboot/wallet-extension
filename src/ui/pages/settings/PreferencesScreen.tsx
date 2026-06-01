import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useWallet } from '@/ui/utils/walletContext';

export default function PreferencesScreen() {
  const navigate = useNavigate();
  const { currentLanguage, t } = useLanguage();
  const wallet = useWallet();
  const [developerLogsEnabled, setDeveloperLogsEnabled] = useState(false);

  useEffect(() => {
    wallet.getEnableDeveloperLogs().then((val: boolean) => {
      setDeveloperLogsEnabled(val);
    });
  }, [wallet]);

  const languages = [
    { code: 'en' as const, name: 'English' },
    { code: 'zh' as const, name: '中文' },
    { code: 'ja' as const, name: '日本語' },
    { code: 'ko' as const, name: '한국어' },
  ];

  const currentLangObj = languages.find((l) => l.code === currentLanguage) || languages[0];

  const getDeveloperLogsLabel = () => {
    switch (currentLanguage) {
      case 'zh':
        return '开发者日志';
      case 'ja':
        return '開発者ログ';
      case 'ko':
        return '개발자 로그';
      default:
        return 'Developer Logs';
    }
  };

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
      <span className='text-[15px] font-semibold text-gray-900 dark:text-gray-100'>{label}</span>
      <div className='flex items-center text-gray-400 dark:text-gray-500'>
        {rightContent}
        {onClick && <ChevronRight className='ml-1 h-5 w-5' />}
      </div>
    </div>
  );

  return (
    <div className='relative flex h-full min-h-full w-full flex-col bg-white pt-14 dark:bg-gray-900'>
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
        <SettingRow label={t('settings.currency')} rightContent={<span>USD</span>} onClick={() => {}} />
        <SettingRow
          label={t('settings.language')}
          rightContent={<span>{currentLangObj.name}</span>}
          onClick={() => navigate('LanguageScreen')}
        />
        <SettingRow label={t('settings.custom_network')} onClick={() => navigate('AddCustomNetwork')} />
        <SettingRow
          label={getDeveloperLogsLabel()}
          rightContent={
            <label className='relative inline-flex cursor-pointer items-center'>
              <input
                type='checkbox'
                checked={developerLogsEnabled}
                onChange={async (e) => {
                  const val = e.target.checked;
                  setDeveloperLogsEnabled(val);
                  await wallet.setEnableDeveloperLogs(val);
                }}
                className='peer sr-only'
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gray-900 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700 dark:peer-checked:bg-gray-100 dark:peer-checked:after:bg-gray-800" />
            </label>
          }
        />
      </div>
    </div>
  );
}
