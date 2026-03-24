/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_ENABLED: string;
  readonly VITE_SENTRY_ENVIRONMENT: string;
  readonly VITE_SENTRY_ERROR_SAMPLE_RATE: string;
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE: string;
  readonly VITE_POSTHOG_KEY: string;
  readonly VITE_POSTHOG_HOST: string;
  readonly VITE_POSTHOG_ENABLED: string;
  readonly NODE_ENV: 'development' | 'production';
  readonly RELEASE_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      RELEASE_VERSION: string;
      VITE_APP_TITLE: string;
      VITE_DEBUG_MODE: string;
      VITE_SENTRY_DSN: string;
      VITE_SENTRY_ENABLED: string;
      VITE_SENTRY_ENVIRONMENT: string;
      VITE_SENTRY_ERROR_SAMPLE_RATE: string;
      VITE_SENTRY_TRACES_SAMPLE_RATE: string;
      VITE_POSTHOG_KEY: string;
      VITE_POSTHOG_HOST: string;
      VITE_POSTHOG_ENABLED: string;
    }
  }
}

export {};
