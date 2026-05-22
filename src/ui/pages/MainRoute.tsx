import { useCallback, useEffect, useRef } from 'react';
import { HashRouter, Route, Routes, useLocation, useNavigate as useNavigateOrigin } from 'react-router';

import SyncBridge from '@/ui/components/SyncBridge';
import { capturePostHogEvent } from '@/shared/telemetry/posthog';

import AccountDetailScreen from './account/AccountDetailScreen';
import AccountSelection from './account/AccountSelection';
import CreateOrImportWalletScreen from './account/CreateOrImportWalletScreen';
import CreatePasswordScreen from './account/CreatePasswordScreen';
import ExportPrivateKeyScreen from './account/ExportPrivateKeyScreen';
import UnlockScreen from './account/UnlockScreen';
import ApprovalConnect from './approval/ApprovalConnect';
import ApprovalSendTransaction from './approval/ApprovalSendTransaction';
import ApprovalSignMessage from './approval/ApprovalSignMessage';
import ApprovalSignTransaction from './approval/ApprovalSignTransaction';
import ApprovalSwitchNetwork from './approval/ApprovalSwitchNetwork';
import BoostScreen from './main/BoostScreen';
import MainScreen from './main/MainScreen';
import WelcomeScreen from './main/WelcomeScreen';
import AddCustomNetwork from './network/AddCustomNetwork';
import NetworkDetailScreen from './network/NetworkDetailScreen';
import NetworkSelection from './network/NetworkSelection';
import ChangePasswordScreen from './settings/ChangePasswordScreen';
import LanguageScreen from './settings/LanguageScreen';
import PreferencesScreen from './settings/PreferencesScreen';
import SettingsScreen from './settings/SettingsScreen';
import WalletLockScreen from './settings/WalletLockScreen';
import History from './wallet/History';
import Receive from './wallet/Receive';
import TransactionDetailScreen from './wallet/TransactionDetailScreen';
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
  ChangePasswordScreen: {
    path: '/settings/change-password',
    element: <ChangePasswordScreen />,
  },
  WalletLockScreen: {
    path: '/settings/wallet-lock',
    element: <WalletLockScreen />,
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
  TransactionDetailScreen: {
    path: '/wallet/history/detail',
    element: <TransactionDetailScreen />,
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
  ApprovalConnect: {
    path: '/approval/connect',
    element: <ApprovalConnect />,
  },
  ApprovalSwitchNetwork: {
    path: '/approval/switch-network',
    element: <ApprovalSwitchNetwork />,
  },
  ApprovalSignTransaction: {
    path: '/approval/sign-transaction',
    element: <ApprovalSignTransaction />,
  },
  ApprovalSendTransaction: {
    path: '/approval/send-transaction',
    element: <ApprovalSendTransaction />,
  },
  ApprovalSignMessage: {
    path: '/approval/sign-message',
    element: <ApprovalSignMessage />,
  },
};

type RouteTypes = keyof typeof routes;

function TelemetryRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    capturePostHogEvent('ui_route_viewed', {
      path: location.pathname,
    });
  }, [location.pathname]);

  return null;
}

// eslint-disable-next-line react-refresh/only-export-components
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
        <TelemetryRouteTracker />
        <Routes>
          {Object.entries(routes).map(([key, value]) => (
            <Route key={key} path={value.path} element={value.element} />
          ))}
        </Routes>
      </SyncBridge>
    </HashRouter>
  );
}
