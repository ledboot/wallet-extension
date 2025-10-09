import { HashRouter, Route, Routes, useNavigate as useNavigateOrigin } from 'react-router';
import SyncBridge from '@/ui/components/SyncBridge';
import BoostScreen from './main/boostScreen';
import WelcomeScreen from './main/welcomeScreen';
import MainScreen from './main/mainScreen';
import { useCallback, useRef } from 'react';
import UnlockScreen from './account/unlockScreen';
import CreatePasswordScreen from './account/createPasswordScreen';
import CreateOrImportWalletScreen from './account/createOrImportWalletScreen';
import AccountSelection from './account/AccountSelection';
import History from './wallet/History';
import NetworkSelection from './network/NetworkSelection';

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
//   SettingsTabScreen: {
//     path: '/settings',
//     element: <SettingsTabScreen />,
//   },
  CreateOrImportWalletScreen: {
    path: '/account/create-or-import-wallet',
    element: <CreateOrImportWalletScreen />,
  },
//   CreateAccountScreen: {
//     path: '/account/create',
//     element: <CreateAccountScreen />,
//   },
  CreatePasswordScreen: {
    path: '/account/create-password',
    element: <CreatePasswordScreen />,
  },
  UnlockScreen: {
    path: '/account/unlock',
    element: <UnlockScreen />,
  },
  AccountSelection: {
    path: '/account/selection',
    element: <AccountSelection />,
  },
  HistoryScreen: {
    path: '/wallet/history',
    element: <History />,
  },
  NetworkSelection: {
    path: '/network/selection',
    element: <NetworkSelection />,
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
          pathname: route.path
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
            <Route
              key={key}
              path={value.path}
              element={value.element}
            />
          ))}
        </Routes>
      </SyncBridge>
    </HashRouter>
  );
}
