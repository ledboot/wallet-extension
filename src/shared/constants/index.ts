import { ChainInfo } from '../types';

export enum ChainType {
  ZENT_MAINNET = 'ZENT_MAINNET',
  ZENT_TESTNET = 'ZENT_TESTNET',
  HOVM_MAINNET = 'HOVM_MAINNET',
  GCT_TESTNET = 'GCT_TESTNET',
}

export enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
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
  [ChainType.ZENT_MAINNET]: {
    label: 'ZENT',
    iconLabel: 'ZENT',
    chainId: 0x1,
    endpoints: ['http://omegasuite.org:9789'],
    icon: './images/artifacts/bitcoin-mainnet.svg',
    unit: 'ZENT',
    networkType: NetworkType.MAINNET,
  },
  [ChainType.ZENT_TESTNET]: {
    label: 'ZENT Testnet',
    iconLabel: 'ZENT',
    chainId: 0x1,
    endpoints: ['http://omegasuite.org:7789'],
    icon: './images/artifacts/bitcoin-mainnet.svg',
    unit: 'ZENT',
    networkType: NetworkType.TESTNET,
  },
  [ChainType.HOVM_MAINNET]: {
    label: 'HOVM Mainnet',
    iconLabel: 'HOVM',
    chainId: 0x2,
    endpoints: ['http://omegasuite.org:3789'],
    icon: './images/artifacts/bitcoin-mainnet.svg',
    unit: 'HOVM',
    networkType: NetworkType.MAINNET,
  },
  [ChainType.GCT_TESTNET]: {
    label: 'GCT Testnet',
    iconLabel: 'GCT',
    chainId: 0x2,
    endpoints: ['http://omegasuite.org:6789'],
    icon: './images/artifacts/bitcoin-mainnet.svg',
    unit: 'GCT',
    networkType: NetworkType.TESTNET,
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

export const MainnetPrivateKeyPrefix = 0x80;
export const MainnetAddressPrefix = 0;
export const TestnetPrivateKeyPrefix = 0xEF;
export const TestnetAddressPrefix = 0x6F;

export const ServerConfigurationIndex = {
  serverrequest: "omegasuite.org/omega",
  chainclass: 0,
}
