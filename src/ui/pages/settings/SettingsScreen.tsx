import { useEffect, useState } from 'react';
import { useNavigate } from '@/ui/pages/MainRoute';
import {
  BookOpen,
  ChevronLeft,
  Clock,
  Contact,
  CreditCard,
  Download,
  FileText,
  HeadphonesIcon,
  Hexagon,
  MessageCircle,
  PenLine,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';

import { useLanguage } from '@/ui/contexts/LanguageContext';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [appVersion, setAppVersion] = useState<string>('1.0.0');

  useEffect(() => {
    // Get version from manifest if available (Chrome extension context)
    if (
      typeof chrome !== 'undefined' &&
      chrome.runtime &&
      chrome.runtime.getManifest
    ) {
      setAppVersion(chrome.runtime.getManifest().version);
    }
  }, []);

  const SettingItem = ({
    icon: Icon,
    label,
    onClick,
  }: {
    icon: any;
    label: string;
    onClick?: () => void;
  }) => (
    <div
      className='flex w-[25%] cursor-pointer flex-col items-center justify-start gap-2 rounded-lg p-2 text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-800'
      onClick={onClick}
    >
      <Icon
        className='h-6 w-6 text-gray-800 dark:text-gray-200'
        strokeWidth={2}
      />
      <span className='break-words text-xs leading-tight text-gray-700 dark:text-gray-300'>
        {label}
      </span>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className='mb-4 px-2 text-sm font-bold text-gray-900 dark:text-white'>
      {title}
    </h3>
  );

  return (
    <div className='flex h-[600px] w-full flex-col bg-white pt-14 dark:bg-gray-900'>
      {/* Header (Absolute/Fixed Position to Match Other Screens) */}
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4 dark:border-gray-800 dark:bg-gray-900'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
        >
          <ChevronLeft className='h-5 w-5 text-gray-800 dark:text-gray-200' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900 dark:text-white'>
          {t('settings.settings')}
        </h1>
        <div className='w-9'></div> {/* Spacer to center title */}
      </div>

      {/* Scrollable Content */}
      <div className='hide-scrollbar flex-1 overflow-y-auto pb-6 text-left'>
        {/* Wallet security section */}
        <div className='border-b border-gray-100 px-4 py-5 dark:border-gray-800'>
          <SectionTitle title={t('settings.wallet_security')} />
          <div className='flex flex-wrap gap-y-6'>
            <SettingItem icon={PenLine} label={t('settings.backups')} />
            <SettingItem icon={ShoppingBag} label={t('settings.password')} />
            <SettingItem icon={Clock} label={t('settings.wallet_lock')} />
          </div>
        </div>

        {/* Basic section */}
        <div className='border-b border-gray-100 px-4 py-5 dark:border-gray-800'>
          <SectionTitle title={t('settings.basic')} />
          <div className='flex flex-wrap gap-y-6'>
            <SettingItem
              icon={CreditCard}
              label={t('settings.wallet_management')}
            />
            <SettingItem icon={Contact} label={t('settings.address_book')} />
            <SettingItem
              icon={SlidersHorizontal}
              label={t('settings.custom_network')}
              onClick={() => navigate('AddCustomNetwork')}
            />
            <SettingItem
              icon={Hexagon}
              label={t('settings.preferences')}
              onClick={() => navigate('PreferencesScreen')}
            />
          </div>
        </div>

        {/* Advanced section */}
        <div className='border-b border-gray-100 px-4 py-5 dark:border-gray-800'>
          <SectionTitle title={t('settings.advanced')} />
          <div className='flex flex-wrap gap-y-6'>
            <SettingItem icon={Trash2} label={t('settings.clear_cache')} />
            <SettingItem icon={Download} label={t('settings.download_logs')} />
          </div>
        </div>

        {/* More section */}
        <div className='mb-8 px-4 py-5'>
          <SectionTitle title={t('settings.more')} />
          <div className='flex flex-wrap gap-y-6'>
            <SettingItem
              icon={FileText}
              label={t('settings.terms_of_service')}
            />
            <SettingItem icon={BookOpen} label={t('settings.privacy_notice')} />
            <SettingItem icon={HeadphonesIcon} label={t('settings.get_help')} />
            <SettingItem icon={MessageCircle} label={t('settings.community')} />
          </div>
        </div>

        {/* App Info Footer */}
        <div className='flex flex-col items-center justify-center pb-8 pt-4'>
          <div className='text-center text-xs font-medium text-gray-400 dark:text-gray-500'>
            ZENT Extension
            <br />v{appVersion}
          </div>
        </div>
      </div>
    </div>
  );
}
