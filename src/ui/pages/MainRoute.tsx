import { useCallback, useRef } from 'react';
import { HashRouter, Route, Routes, useNavigate as useNavigateOrigin } from 'react-router';

import SyncBridge from '@/ui/components/SyncBridge';

import AccountDetailScreen from './account/AccountDetailScreen';
import AccountSelection from './account/AccountSelection';
import CreateOrImportWalletScreen from './account/CreateOrImportWalletScreen';
import CreatePasswordScreen from './account/CreatePasswordScreen';
import ExportPrivateKeyScreen from './account/ExportPrivateKeyScreen';
import UnlockScreen from './account/UnlockScreen';
import BoostScreen from './main/BoostScreen';
import MainScreen from './main/MainScreen';
import WelcomeScreen from './main/WelcomeScreen';
import AddCustomNetwork from './network/AddCustomNetwork';
import NetworkDetailScreen from './network/NetworkDetailScreen';
import NetworkSelection from './network/NetworkSelection';
import LanguageScreen from './settings/LanguageScreen';
import PreferencesScreen from './settings/PreferencesScreen';
import SettingsScreen from './settings/SettingsScreen';
import History from './wallet/History';
import Receive from './wallet/Receive';
import AmountInputScreen from './wallet/transfer/AmountInputScreen';
import RecipientAddressScreen from './wallet/transfer/RecipientAddressScreen';
// Import transfer screens
import TokenSelectionScreen from './wallet/transfer/TokenSelectionScreen';
import TransactionConfirmScreen from './wallet/transfer/TransactionConfirmScreen';

const routes = {
  BoostScreen: {
    path: '/',
    element: <BoostScreen />,
  },
  WelcomeScreen: {
    path: '/welcome',
    element: <WelcomeScreen />,
  },
  MainScreen: {
    path: '/main',
    element: <MainScreen />,
  },
  SettingsScreen: {
    path: '/settings',
    element: <SettingsScreen />,
  },
  PreferencesScreen: {
    path: '/settings/preferences',
    element: <PreferencesScreen />,
  },
  LanguageScreen: {
    path: '/settings/language',
    element: <LanguageScreen />,
  },
  CreateOrImportWalletScreen: {
    path: '/account/create-or-import-wallet',
    element: <CreateOrImportWalletScreen />,
  },
  CreatePasswordScreen: {
    path: '/account/create-password',
    element: <CreatePasswordScreen />,
  },
  ExportPrivateKeyScreen: {
    path: '/account/export-private-key',
    element: <ExportPrivateKeyScreen />,
  },
  UnlockScreen: {
    path: '/account/unlock',
    element: <UnlockScreen />,
  },
  AccountSelection: {
    path: '/account/selection',
    element: <AccountSelection />,
  },
  AccountDetailScreen: {
    path: '/account/detail',
    element: <AccountDetailScreen />,
  },
  // Transfer flow routes
  TokenSelectionScreen: {
    path: '/wallet/transfer/select-token',
    element: <TokenSelectionScreen />,
  },
  RecipientAddressScreen: {
    path: '/wallet/transfer/recipient-address',
    element: <RecipientAddressScreen />,
  },
  AmountInputScreen: {
    path: '/wallet/transfer/amount-input',
    element: <AmountInputScreen />,
  },
  TransactionConfirmScreen: {
    path: '/wallet/transfer/confirm',
    element: <TransactionConfirmScreen />,
  },
  HistoryScreen: {
    path: '/wallet/history',
    element: <History />,
  },
  NetworkSelection: {
    path: '/network/selection',
    element: <NetworkSelection />,
  },
  AddCustomNetwork: {
    path: '/network/add-custom-network',
    element: <AddCustomNetwork />,
  },
  NetworkDetailScreen: {
    path: '/network/detail',
    element: <NetworkDetailScreen />,
  },
  ReceiveScreen: {
    path: '/wallet/receive',
    element: <Receive />,
  },
};

type RouteTypes = keyof typeof routes;

export function useNavigate() {
  const navigate = useNavigateOrigin();
  const navigatingRef = useRef(false);

  return useCallback(
    (routKey: RouteTypes | '#back', state?: any, pathState?: any) => {
      /** Prevent duplicate route stack caused by parent-child inscription navigation */
      if (navigatingRef.current) {
        return;
      }

      navigatingRef.current = true;

      if (routKey === '#back') {
        window.history.back();
        navigatingRef.current = false;
        return;
      }

      if (!routes[routKey]) {
        navigatingRef.current = false;
        return;
      }

      const route: any = routes[routKey];
      if (route.getDynamicPath) {
        const path = route.getDynamicPath(pathState);
        navigate(path, { replace: false, state });
        navigatingRef.current = false;
        return;
      }

      navigate(
        {
          pathname: route.path,
        },
        { replace: false, state }
      );

      navigatingRef.current = false;
    },
    [navigate]
  );
}

export default function MainRoute() {
  return (
    <HashRouter>
      <SyncBridge>
        <Routes>
          {Object.entries(routes).map(([key, value]) => (
            <Route key={key} path={value.path} element={value.element} />
          ))}
        </Routes>
      </SyncBridge>
    </HashRouter>
  );
}
