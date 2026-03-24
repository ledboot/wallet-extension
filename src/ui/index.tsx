import { createRoot } from 'react-dom/client';

import '@/assets/styles/index.css';

import { Toaster } from 'sonner';

import { Message } from '@/shared/utils';
import { capturePostHogEvent, capturePostHogException, initPostHog } from '@/shared/telemetry/posthog';
import { captureSentryException, initSentry } from '@/shared/telemetry/sentry';

import { AppDimensions } from './components/AppDimensions';
import { LanguageProvider } from './contexts/LanguageContext';
import MainRoute from './pages/MainRoute';
import { WalletProvider } from './utils/walletContext';

const { PortMessage } = Message;
const TELEMETRY_ERROR_LISTENER_KEY = '__zent_ui_telemetry_listeners__';
const TRACKED_WALLET_ACTIONS = new Set<string>([
  'boot',
  'unlock',
  'verifyPassword',
  'importPrivateKey',
  'changePassword',
  'lockWallet',
  'setAutoLockTimeId',
  'changeKeyring',
  'removeAccount',
  'removeKeyring',
  'updateAccountAlianName',
  'updateKeyringAlianName',
  'changeNetwork',
  'addchainInfo',
  'clearCache',
  'transfer',
  'updateTransferAddressesHistory',
  'resolveApproval',
  'rejectApproval',
]);

const getErrorName = (error: unknown): string => {
  if (error instanceof Error && error.name) return error.name;
  return 'UnknownError';
};

const registerUiTelemetryErrorHandlers = (): void => {
  const telemetryState = window as Window & { [TELEMETRY_ERROR_LISTENER_KEY]?: boolean };
  if (telemetryState[TELEMETRY_ERROR_LISTENER_KEY]) {
    return;
  }

  telemetryState[TELEMETRY_ERROR_LISTENER_KEY] = true;

  window.addEventListener('error', (event: ErrorEvent) => {
    const error = event.error || event.message;
    capturePostHogException(error, {
      event: 'window.error',
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    capturePostHogException(event.reason, {
      event: 'window.unhandledrejection',
    });
  });
};

const portMessageChannel = new PortMessage();

portMessageChannel.connect('popup');

initSentry('ui');
initPostHog('ui');
registerUiTelemetryErrorHandlers();
capturePostHogEvent('ui_popup_opened');

const wallet: Record<string, any> = new Proxy(
  {},
  {
    get(obj, key) {
      const action = String(key);
      switch (key) {
        default:
          return async function (...args: any[]) {
            const startedAt = Date.now();
            const shouldTrack = TRACKED_WALLET_ACTIONS.has(action);

            try {
              const result = await Promise.resolve(
                portMessageChannel.request({
                  type: 'controller',
                  method: key,
                  args,
                })
              );

              if (shouldTrack) {
                capturePostHogEvent('wallet_action_succeeded', {
                  action,
                  duration_ms: Date.now() - startedAt,
                });
              }

              return result;
            } catch (error) {
              const durationMs = Date.now() - startedAt;

              if (shouldTrack) {
                capturePostHogEvent('wallet_action_failed', {
                  action,
                  duration_ms: durationMs,
                  error_name: getErrorName(error),
                });
              }

              capturePostHogException(error, {
                event: 'wallet_action_failed',
                action,
                duration_ms: durationMs,
              });
              captureSentryException(error, {
                event: 'wallet_action_failed',
                action,
                durationMs,
              });

              throw error;
            }
          };
      }
    },
  }
);

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <WalletProvider wallet={wallet as any}>
    <LanguageProvider>
      <AppDimensions>
        <Toaster position='bottom-right' duration={2000} />
        <MainRoute />
      </AppDimensions>
    </LanguageProvider>
  </WalletProvider>
);
