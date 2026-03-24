import posthog from 'posthog-js/dist/module.no-external';

import { getTelemetryConfig } from './config';

let posthogInitialized = false;
let posthogRuntime: 'ui' | null = null;

const toExceptionMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
};

export const initPostHog = (runtime: 'ui'): void => {
  if (posthogInitialized || typeof window === 'undefined') {
    return;
  }

  const config = getTelemetryConfig();
  if (!config.posthogEnabled || !config.posthogKey) {
    return;
  }

  posthog.init(config.posthogKey, {
    api_host: config.posthogHost,
    autocapture: false,
    capture_pageview: false,
    disable_external_dependency_loading: true,
    disable_surveys: true,
    disable_web_experiments: true,
    persistence: 'localStorage',
    loaded: (client) => {
      client.register({
        app: 'zent-wallet-extension',
        runtime,
        release: config.release,
      });
    },
  });

  posthogRuntime = runtime;
  posthogInitialized = true;
};

export const capturePostHogEvent = (
  eventName: string,
  properties?: Record<string, unknown>
): void => {
  if (!posthogInitialized || !eventName) {
    return;
  }

  posthog.capture(eventName, {
    ...(properties || {}),
    runtime: posthogRuntime || undefined,
  });
};

export const capturePostHogException = (
  error: unknown,
  properties?: Record<string, unknown>
): void => {
  if (!posthogInitialized) {
    return;
  }

  const posthogClient = posthog as unknown as {
    captureException?: (error: unknown, properties?: Record<string, unknown>) => void;
    capture: (eventName: string, properties?: Record<string, unknown>) => void;
  };

  if (posthogClient.captureException) {
    posthogClient.captureException(error, properties);
    return;
  }

  posthogClient.capture('ui_exception', {
    ...(properties || {}),
    message: toExceptionMessage(error),
  });
};

export const identifyPostHogUser = (
  userId: string,
  userProperties?: Record<string, unknown>
): void => {
  if (!posthogInitialized || !userId) {
    return;
  }
  posthog.identify(userId, userProperties);
};

export const resetPostHogUser = (): void => {
  if (!posthogInitialized) {
    return;
  }
  posthog.reset();
};
