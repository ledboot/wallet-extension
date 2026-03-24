import { compareVersions } from 'compare-versions';

import { CHAIN_INFO, ChainType, DEFAULT_LOCKTIME_ID } from '@/shared/constants';
import { ChainInfo } from '@/shared/types';

import createPersistStore from '../utils/persisitStore';

export interface PreferenceStore {
  currentKeyringKey: string;
  currentAccountIndex: number;
  locale: string;
  currentVersion: string;
  firstOpen: boolean;
  enableSignData: boolean;
  autoLockTimeId: number;
  openInSidePanel: boolean;
  accountAlianNames: {
    [key: string]: string;
  };
  addressFlags: { [key: string]: number };
  keyringAlianNames: {
    [key: string]: string;
  };
  chainInfo: { [key: string]: ChainInfo };
  currentChainInfo: ChainInfo;
}

const version = chrome.runtime.getManifest().version;

class PreferenceService {
  store!: PreferenceStore;
  popupOpen = false;

  init = async () => {
    this.store = await createPersistStore<PreferenceStore>({
      name: 'preference',
      template: {
        currentKeyringKey: '',
        currentAccountIndex: 0,
        locale: 'en',
        currentVersion: '0',
        firstOpen: false,
        enableSignData: false,
        autoLockTimeId: DEFAULT_LOCKTIME_ID,
        openInSidePanel: false,
        accountAlianNames: {},
        addressFlags: {},
        keyringAlianNames: {},
        chainInfo: { ...CHAIN_INFO },
        currentChainInfo: CHAIN_INFO[ChainType.ZENT_MAINNET],
      },
    });

    if (typeof this.store.autoLockTimeId !== 'number') {
      this.store.autoLockTimeId = DEFAULT_LOCKTIME_ID;
    }

    if (!this.store.chainInfo) {
      this.store.chainInfo = { ...CHAIN_INFO };
    } else {
      let needsUpdate = false;
      for (const [key, info] of Object.entries(CHAIN_INFO)) {
        if (!this.store.chainInfo[key] || this.store.chainInfo[key].updated < info.updated) {
          this.store.chainInfo[key] = info;
          needsUpdate = true;
        }
      }
      if (needsUpdate) {
        this.store.chainInfo = { ...this.store.chainInfo };
      }
    }
  };

  getIsFirstOpen = () => {
    if (!this.store.currentVersion || compareVersions(version, this.store.currentVersion)) {
      this.store.currentVersion = version;
      this.store.firstOpen = true;
    }
    return this.store.firstOpen;
  };

  updateIsFirstOpen = () => {
    this.store.firstOpen = false;
  };

  getAutoLockTimeId = () => {
    return this.store.autoLockTimeId;
  };

  setAutoLockTimeId = (timeId: number) => {
    this.store.autoLockTimeId = timeId;
  };

  setPopupOpen = (isOpen: boolean) => {
    this.popupOpen = isOpen;
  };

  setAccountAlianName = (accountKey: string, name: string) => {
    this.store.accountAlianNames = Object.assign({}, this.store.accountAlianNames, { [accountKey]: name });
  };

  getAccountAlianName = (accountKey: string, defaultName?: string) => {
    const name = this.store.accountAlianNames[accountKey];
    if (!name && defaultName) {
      this.store.accountAlianNames[accountKey] = defaultName;
    }
    return this.store.accountAlianNames[accountKey];
  };

  getAddressFlag = (address: string) => {
    return this.store.addressFlags[address] || 0;
  };
  setAddressFlag = (address: string, flag: number) => {
    this.store.addressFlags = Object.assign({}, this.store.addressFlags, {
      [address]: flag,
    });
  };

  setKeyringAlianName = (keyringKey: string, name: string) => {
    this.store.keyringAlianNames = Object.assign({}, this.store.keyringAlianNames, { [keyringKey]: name });
  };

  getKeyringAlianName = (keyringKey: string, defaultName?: string) => {
    const name = this.store.keyringAlianNames[keyringKey];
    if (!name && defaultName) {
      this.store.keyringAlianNames[keyringKey] = defaultName;
    }
    return this.store.keyringAlianNames[keyringKey];
  };

  removeAccountAlianName = (accountKey: string) => {
    const newAccountAlianNames = { ...this.store.accountAlianNames };
    delete newAccountAlianNames[accountKey];
    this.store.accountAlianNames = newAccountAlianNames;
  };

  removeKeyringAlianName = (keyringKey: string) => {
    const newKeyringAlianNames = { ...this.store.keyringAlianNames };
    delete newKeyringAlianNames[keyringKey];
    this.store.keyringAlianNames = newKeyringAlianNames;
  };

  getCurrentKeyringKey = () => {
    return this.store.currentKeyringKey;
  };

  setCurrentKeyringKey = (keyringKey: string) => {
    this.store.currentKeyringKey = keyringKey;
  };

  getCurrentAccountIndex = () => {
    return this.store.currentAccountIndex;
  };

  setCurrentAccountIndex = (accountIndex: number) => {
    this.store.currentAccountIndex = accountIndex;
  };

  getLocale = () => {
    return this.store.locale;
  };

  setLocale = (locale: string) => {
    this.store.locale = locale;
  };

  getCurrentChainInfo = () => {
    return this.store.currentChainInfo;
  };

  setCurrentChainInfo = (chainInfo: ChainInfo) => {
    this.store.currentChainInfo = chainInfo;
  };

  addchainInfo = (chainType: string, chainInfo: ChainInfo) => {
    if (!this.store.chainInfo) {
      this.store.chainInfo = {};
    }
    this.store.chainInfo[chainType] = chainInfo;

    const updatedChainInfo = { ...this.store.chainInfo };
    this.store.chainInfo = updatedChainInfo;
  };

  getchainInfo = (chainType: string): ChainInfo | undefined => {
    return this.store.chainInfo ? this.store.chainInfo[chainType] : undefined;
  };

  getAllchainInfo = (): { [key: string]: ChainInfo } => {
    return this.store.chainInfo || {};
  };

  removechainInfo = (chainType: string) => {
    if (this.store.chainInfo) {
      delete this.store.chainInfo[chainType];
    }
  };
}

export default new PreferenceService();
