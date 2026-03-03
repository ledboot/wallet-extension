import { Check, ChevronLeft, X } from 'lucide-react';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/mainRoute';

export default function LanguageScreen() {
  const navigate = useNavigate();
  const { currentLanguage, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'en' as const, name: 'English' },
    { code: 'zh' as const, name: '中文' },
    { code: 'ja' as const, name: '日本語' },
    { code: 'ko' as const, name: '한국어' },
  ];

  const handleSelect = (code: 'en' | 'zh' | 'ja' | 'ko') => {
    setLanguage(code);
    navigate('#back');
  };

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
          {t('settings.select_language')}
        </h1>
        <button
          onClick={() => navigate('MainScreen')}
          className='-mr-2 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
        >
          <X className='h-5 w-5 text-gray-800 dark:text-gray-200' />
        </button>
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto px-4 pb-6 pt-2'>
        <div className='flex flex-col space-y-2'>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className='flex w-full items-center justify-between rounded-xl px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800'
              onClick={() => handleSelect(lang.code)}
            >
              <div className='flex items-center'>
                <span className='text-[15px] font-semibold text-gray-900 dark:text-gray-100'>
                  {lang.name}
                </span>
              </div>
              {currentLanguage === lang.code && (
                <Check
                  className='h-5 w-5 text-black dark:text-white'
                  strokeWidth={2.5}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
