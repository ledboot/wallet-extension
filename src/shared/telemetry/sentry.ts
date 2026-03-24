import * as Sentry from '@sentry/browser';

import { getTelemetryConfig, TelemetryRuntime } from './config';

let sentryInitialized = false;
let sentryRuntime: TelemetryRuntime | null = null;

const toErrorLike = (input: unknown): Error => {
  if (input instanceof Error) {
    return input;
  }
  if (typeof input === 'string') {
    return new Error(input);
  }
  try {
    return new Error(JSON.stringify(input));
  } catch {
    return new Error(String(input));
  }
};

export const initSentry = (runtime: TelemetryRuntime): void => {
  if (sentryInitialized) {
    return;
  }

  const config = getTelemetryConfig();
  if (!config.sentryEnabled || !config.sentryDsn) {
    return;
  }

  sentryRuntime = runtime;
  Sentry.init({
    dsn: config.sentryDsn,
    enabled: true,
    environment: config.environment,
    release: config.release,
    sampleRate: config.sentryErrorSampleRate,
    tracesSampleRate: config.sentryTracesSampleRate,
    initialScope: (scope) => {
      scope.setTag('app', 'zent-wallet-extension');
      scope.setTag('runtime', runtime);
      return scope;
    },
    beforeSend: (event) => {
      event.tags = {
        ...(event.tags || {}),
        runtime,
      };
      return event;
    },
  });

  sentryInitialized = true;
};

export const captureSentryException = (
  error: unknown,
  extra?: Record<string, unknown>
): void => {
  if (!sentryInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (sentryRuntime) {
      scope.setTag('runtime', sentryRuntime);
    }
    if (extra) {
      scope.setExtras(extra);
    }
    Sentry.captureException(toErrorLike(error));
  });
};

export const setSentryUser = (userId: string): void => {
  if (!sentryInitialized || !userId) {
    return;
  }
  Sentry.setUser({ id: userId });
};

export const clearSentryUser = (): void => {
  if (!sentryInitialized) {
    return;
  }
  Sentry.setUser(null);
};
