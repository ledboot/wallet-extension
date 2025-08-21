/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_DEBUG_MODE: string;
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
    }
  }
}

export {};
