import { useCallback, useEffect } from 'react';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { getUiType } from '@/ui/utils';
import { useWallet } from '@/ui/utils/walletContext';

import { useNavigate } from '../MainRoute';

export default function BoostScreen() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { t } = useLanguage();
  const loadView = useCallback(async () => {
    const uiType = getUiType();
    console.log('uiType', uiType);
    const isBooted = await wallet.isBooted();
    const hasVault = await wallet.hasVault();
    const isUnlocked = await wallet.isUnlocked();
    console.log('isBooted', isBooted);
    console.log('hasVault', hasVault);
    console.log('isUnlocked', isUnlocked);

    if (!isBooted) {
      navigate('WelcomeScreen');
      return;
    }

    if (!isUnlocked) {
      navigate('UnlockScreen');
      return;
    }

    if (!hasVault) {
      navigate('WelcomeScreen');
      return;
    }

    const currentAccount = await wallet.getCurrentAccount();
    console.log('currentAccount', currentAccount);
    if (!currentAccount) {
      navigate('WelcomeScreen');
      return;
    }

    navigate('MainScreen');
  }, [navigate, wallet]);

  const init = useCallback(async () => {
    const ready = await wallet.isReady();

    if (ready) {
      loadView();
    } else {
      setTimeout(() => {
        init();
      }, 1000);
    }
  }, [loadView, wallet]);

  useEffect(() => {
    init();
  }, [init]);

  return <div>{t('boost.boosting')}</div>;
}
