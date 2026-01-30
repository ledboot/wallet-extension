import React from 'react';
import { useLanguage } from '@/ui/contexts/LanguageContext';

export function LanguageExample() {
  const { t, currentLanguage } = useLanguage();

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">
        {t('common.success')} - Language: {currentLanguage}
      </h2>
      
      <div className="space-y-2">
        <p>{t('header.refresh')}</p>
        <p>{t('header.settings')}</p>
        <p>{t('header.language')}</p>
        <p>{t('account.add_wallet')}</p>
        <p>{t('account.delete_wallet')}</p>
        <p>{t('common.confirm')}</p>
        <p>{t('common.cancel')}</p>
      </div>
    </div>
  );
}

// 使用示例：
// 在任何组件中导入并使用：
// import { LanguageExample } from '@/ui/components/LanguageExample';
// <LanguageExample />
