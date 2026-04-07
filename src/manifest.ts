import { defineManifest } from '@crxjs/vite-plugin';

import packageData from '../package.json';

const DEFAULT_TELEMETRY_HOST_PERMISSIONS = [
  'https://*.ingest.sentry.io/*',
  'https://us.i.posthog.com/*',
  'https://eu.i.posthog.com/*',
];

const toHostPermission = (value?: string): string | null => {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const normalized = raw.includes('://') ? raw : `https://${raw}`;
    const parsedUrl = new URL(normalized);
    return `${parsedUrl.protocol}//${parsedUrl.host}/*`;
  } catch {
    return null;
  }
};

const getTelemetryHostPermissions = (): string[] => {
  const hostPermissions = new Set<string>(DEFAULT_TELEMETRY_HOST_PERMISSIONS);

  const sentryPermission = toHostPermission(process.env.VITE_SENTRY_DSN);
  if (sentryPermission) {
    hostPermissions.add(sentryPermission);
  }

  const posthogPermission = toHostPermission(process.env.VITE_POSTHOG_HOST);
  if (posthogPermission) {
    hostPermissions.add(posthogPermission);
  }

  return [...hostPermissions];
};

const telemetryHostPermissions = getTelemetryHostPermissions();

const createManifest = (isDev: boolean) =>
  defineManifest({
    manifest_version: 3,
    name: `${packageData.displayName || packageData.name}${isDev ? ` ➡️ Dev` : ''}`,
    version: packageData.version,
    description: packageData.description,
    minimum_chrome_version: '89',
    background: {
      service_worker: 'src/background/index.ts',
      type: 'module',
    },
    action: {
      default_popup: 'index.html',
      default_icon: {
        16: 'public/icon16.png',
        32: 'public/icon32.png',
        48: 'public/icon48.png',
        128: 'public/icon128.png',
      },
    },
    icons: {
      16: 'public/icon16.png',
      32: 'public/icon32.png',
      48: 'public/icon48.png',
      128: 'public/icon128.png',
    },
    permissions: ['activeTab', 'storage', 'unlimitedStorage', 'clipboardRead'],
    host_permissions: telemetryHostPermissions,
    content_scripts: [
      {
        js: ['src/content_scripts/index.ts'],
        matches: ['<all_urls>'],
        run_at: 'document_start',
      },
      {
        js: ['src/content_scripts/inpage.ts'],
        matches: ['<all_urls>'],
        run_at: 'document_start',
        world: 'MAIN',
      },
    ],
    web_accessible_resources: [
      {
        resources: ['*.js', '*.css', 'public/images/*', 'public/zentlogo.png', 'public/zentcoin.png'],
        matches: ['<all_urls>'],
      },
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'none';",
    },
  });

export default createManifest;
