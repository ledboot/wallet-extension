export type ChainInfo = {
  name: string;
  chainId: number;
  endpoints: string[];
};

export type CHAINS_ENUM = ChainType;

export enum ChainType {
  OMEGA_MAINNET = 'OMEGA_MAINNET',
  OMEGA_TESTNET = 'OMEGA_TESTNET',
}

export const IS_WINDOWS = /windows/i.test(navigator.userAgent);
export const IS_CHROME = /Chrome\//i.test(navigator.userAgent);
export const IS_FIREFOX = /Firefox\//i.test(navigator.userAgent);

export const KEYRING_TYPE = {
  HdKeyring: 'HD Key Tree',
  SimpleKeyring: 'Simple Key Pair',
  Empty: 'Empty',
};

export const INTERNAL_REQUEST_ORIGIN = 'https://astronexus.io';

export const BRAND_ALIAN_TYPE_TEXT = {
  [KEYRING_TYPE.HdKeyring]: 'Account',
  [KEYRING_TYPE.SimpleKeyring]: 'Private Key',
};

export const KEYRING_TYPES: {
  [key: string]: {
    name: string;
    tag: string;
    alianName: string;
  };
} = {
  'HD Key Tree': {
    name: 'HD Key Tree',
    tag: 'HD',
    alianName: 'HD Wallet',
  },
  'Simple Key Pair': {
    name: 'Simple Key Pair',
    tag: 'IMPORT',
    alianName: 'Single Wallet',
  },
};

export const EVENTS = {
  broadcastToUI: 'broadcastToUI',
  broadcastToBackground: 'broadcastToBackground',
  SIGN_FINISHED: 'SIGN_FINISHED',
  WALLETCONNECT: {
    STATUS_CHANGED: 'WALLETCONNECT_STATUS_CHANGED',
    INIT: 'WALLETCONNECT_INIT',
    INITED: 'WALLETCONNECT_INITED',
  },
};

export const CHAIN_INFO: { [key in ChainType]: ChainInfo } = {
  [ChainType.OMEGA_MAINNET]: {
    name: 'OMEGA_MAINNET',
    chainId: 1,
    endpoints: [
      'http://lsomg.com:8789',
      'http://omegasuite.org:8789',
      'http://207.246.106.17:8789',
      'http://78.141.214.76:8789',
      'http://78.141.236.245:8789',
      'http://136.244.116.65:8789',
      'http://140.82.54.243:8789',
      'http://45.77.63.131:8789',
    ],
  },
  [ChainType.OMEGA_TESTNET]: {
    name: 'OMEGA_TESTNET',
    chainId: 1,
    endpoints: [
      'http://lsomg.com:18840',
      'http://omegasuite.org:18840',
      'http://207.246.106.17:18840',
      'http://78.141.214.76:18840',
    ],
  },
};

export const AUTO_LOCK_TIMES = [
  { id: 0, time: 30000 },
  { id: 1, time: 60000 },
  { id: 2, time: 180000 },
  { id: 3, time: 300000 },
  { id: 4, time: 600000 },
  { id: 5, time: 1800000 },
  { id: 6, time: 3600000 },
  { id: 7, time: 14400000 },
];

export const getAutoLockTimes = () => [
  { id: 0, time: 30000, label: '30秒' },
  { id: 1, time: 60000, label: '1分钟' },
  { id: 2, time: 180000, label: '3分钟' },
  { id: 3, time: 300000, label: '5分钟' },
  { id: 4, time: 600000, label: '10分钟' },
  { id: 5, time: 1800000, label: '30分钟' },
  { id: 6, time: 3600000, label: '1小时' },
  { id: 7, time: 14400000, label: '4小时' },
];

export const DEFAULT_LOCKTIME_ID = 5;
