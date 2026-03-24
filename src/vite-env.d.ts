/// <reference types="vite/client" />

// 环境变量类型定义
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  readonly VITE_DEBUG: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SENTRY_ENABLED: string
  readonly VITE_SENTRY_ENVIRONMENT: string
  readonly VITE_SENTRY_ERROR_SAMPLE_RATE: string
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE: string
  readonly VITE_POSTHOG_KEY: string
  readonly VITE_POSTHOG_HOST: string
  readonly VITE_POSTHOG_ENABLED: string
  readonly NODE_ENV: 'development' | 'production' | 'test'
  readonly RELEASE_VERSION: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}


// Chrome扩展API类型
declare global {
  interface Window {
    chrome: typeof chrome
    require: any
  }
}

// Vite script imports
declare module '*.ts?url' {
  const url: string;
  export default url;
}

declare module '*.js?url' {
  const url: string;
  export default url;
}
