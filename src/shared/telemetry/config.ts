export type TelemetryRuntime = 'ui' | 'background';

export interface TelemetryConfig {
  release: string;
  environment: string;
  sentryDsn: string;
  sentryEnabled: boolean;
  sentryErrorSampleRate: number;
  sentryTracesSampleRate: number;
  posthogKey: string;
  posthogHost: string;
  posthogEnabled: boolean;
}

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
};

const parseSampleRate = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, Math.min(1, parsed));
};

export const getTelemetryConfig = (): TelemetryConfig => {
  const release = import.meta.env.RELEASE_VERSION || 'unknown';
  const environment =
    import.meta.env.VITE_SENTRY_ENVIRONMENT ||
    import.meta.env.NODE_ENV ||
    'development';
  const sentryDsn = (import.meta.env.VITE_SENTRY_DSN || '').trim();
  const posthogKey = (import.meta.env.VITE_POSTHOG_KEY || '').trim();

  return {
    release,
    environment,
    sentryDsn,
    sentryEnabled: parseBoolean(import.meta.env.VITE_SENTRY_ENABLED, true),
    sentryErrorSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_ERROR_SAMPLE_RATE, 1),
    sentryTracesSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0),
    posthogKey,
    posthogHost: (import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com').trim(),
    posthogEnabled: parseBoolean(import.meta.env.VITE_POSTHOG_ENABLED, true),
  };
};
