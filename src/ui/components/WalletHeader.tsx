import { useEffect, useState } from 'react';
import { Check, ChevronDown, Copy, Globe, Settings, RefreshCw, Languages } from 'lucide-react';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useCurrentAccount } from '@/ui/state/hooks';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { toast } from 'sonner';

interface WalletHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function WalletHeader({ onRefresh, isRefreshing = false }: WalletHeaderProps) {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [shortAddress, setShortAddress] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const languages = [
    { code: 'zh' as const, name: t('lang.chinese'), flag: '🇨🇳' },
    { code: 'en' as const, name: t('lang.english'), flag: '🇺🇸' },
    { code: 'ja' as const, name: t('lang.japanese'), flag: '🇯🇵' },
    { code: 'ko' as const, name: t('lang.korean'), flag: '🇰🇷' },
  ];

  useEffect(() => {
    if (currentAccount) {
      setShortAddress(`${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`);
    }
  }, [currentAccount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (isSettingsOpen && !target.closest('.settings-dropdown')) {
        setIsSettingsOpen(false);
        setIsLanguageMenuOpen(false);
      }
      
      if (isLanguageMenuOpen && !target.closest('.language-submenu')) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen, isLanguageMenuOpen]);

  const changeLanguage = (languageCode: 'zh' | 'en' | 'ja' | 'ko') => {
    setLanguage(languageCode);
    const selectedLanguage = languages.find(l => l.code === languageCode);
    toast.success(`${t('header.language_changed')} ${selectedLanguage?.name}`);
    setIsLanguageMenuOpen(false);
    setIsSettingsOpen(false);
  };

  

  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!currentAccount) return;
    navigator.clipboard.writeText(currentAccount.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('header.address_copied'));
  };


  return (
    <div className='w-full sticky top-0 z-20 flex h-14 items-center justify-between px-4 py-[15px]'>
      <div className='flex items-center space-x-3'>
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary'>
          <span className='text-primary-foreground text-sm font-bold'>N</span>
        </div>
        <div>
          <button
            onClick={() => navigate('AccountSelection', { currentAccount: currentAccount })}
            className='flex items-center space-x-1 text-sm font-medium cursor-pointer'
          >
            <span>{currentAccount?.alianName || ''}</span>
            <ChevronDown className='text-muted-foreground h-4 w-4' />
          </button>
          <button
            onClick={copyAddress}
            className='text-muted-foreground hover:text-foreground flex items-center space-x-1 text-xs'
          >
            <span>{shortAddress}</span>
            {copied ? (
              <Check className='h-3 w-3 text-success' />
            ) : (
              <Copy className='h-3 w-3' />
            )}
          </button>
        </div>
         <button
          className={`p-1.5 rounded-full ${
            isRefreshing
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          } transition-colors`}
          onClick={(e) => {
            e.stopPropagation();
            if (onRefresh && !isRefreshing) {
              onRefresh();
            }
          }}
          disabled={isRefreshing}
          title={t('header.refresh')}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className='flex items-center space-x-2'>
        <div className="relative settings-dropdown">
          <Settings 
            className='h-7 w-7 p-1 cursor-pointer hover:bg-gray-100 rounded' 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          />
          
          {isSettingsOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-2">
                {/* Language menu item with submenu */}
                <div className="relative language-submenu">
                  <button
                    onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Languages className="h-4 w-4" />
                      <span className="text-gray-700 dark:text-gray-300">{t('header.language')}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isLanguageMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="p-1">
                        {languages.map((language) => (
                          <button
                            key={language.code}
                            onClick={() => changeLanguage(language.code)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <span>{language.flag}</span>
                              <span className="text-gray-700 dark:text-gray-300">{language.name}</span>
                            </div>
                            {currentLanguage === language.code && (
                              <Check className="h-4 w-4 text-blue-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className='h-7 w-7 p-1 cursor-pointer hover:bg-gray-100 rounded' onClick={()=>navigate('NetworkSelection')} title={t('header.network')}>
          <Globe className='h-5 w-5' />
        </div>
      </div>
    </div>
  );
}
