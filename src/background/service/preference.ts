import { compareVersions } from 'compare-versions';
import { cloneDeep } from 'lodash-es';

import { DEFAULT_LOCKTIME_ID, EVENTS } from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import {
  Account,
  AnexBalance,
  NetworkType,
  TxHistoryItem,
} from '@/shared/types';

import createPersistStore from '../utils/persisitStore';
import { sessionService } from './index';

export interface PreferenceStore {
  currentKeyringIndex: number;
  currentAccount: Account | undefined | null;
  balance: AnexBalance;
  locale: string;
  networkType: NetworkType;
  currentVersion: string;
  firstOpen: boolean;
  txHistory: TxHistoryItem[];
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
}

// const SUPPORTED_LOCALES = ['en', 'zh_CN'];

const version = chrome.runtime.getManifest().version;

class PreferenceService {
  store!: PreferenceStore;
  popupOpen = false;

  init = async () => {
    this.store = await createPersistStore<PreferenceStore>({
      name: 'preference',
      template: {
        currentKeyringIndex: 0,
        currentAccount: undefined,
        balance: {
          confirm_amount: '0',
          pending_amount: '0',
          amount: '0',
        },
        locale: 'en',
        networkType: NetworkType.MAINNET,
        currentVersion: '0',
        firstOpen: false,
        txHistory: [],
        enableSignData: false,
        autoLockTimeId: DEFAULT_LOCKTIME_ID,
        openInSidePanel: false,
        accountAlianNames: {},
        addressFlags: {},
        keyringAlianNames: {},
      },
    });
    if (typeof this.store.autoLockTimeId !== 'number') {
      this.store.autoLockTimeId = DEFAULT_LOCKTIME_ID;
    }
  };

  getIsFirstOpen = () => {
    if (
      !this.store.currentVersion ||
      compareVersions(version, this.store.currentVersion)
    ) {
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

  setPopupOpen = (isOpen: boolean) => {
    this.popupOpen = isOpen;
  };

  // accountAlianNames
  setAccountAlianName = (accountKey: string, name: string) => {
    this.store.accountAlianNames = Object.assign(
      {},
      this.store.accountAlianNames,
      { [accountKey]: name }
    );
  };

  getAccountAlianName = (accountKey: string, defaultName?: string) => {
    const name = this.store.accountAlianNames[accountKey];
    if (!name && defaultName) {
      this.store.accountAlianNames[accountKey] = defaultName;
    }
    return this.store.accountAlianNames[accountKey];
  };

  // get address flag
  getAddressFlag = (address: string) => {
    return this.store.addressFlags[address] || 0;
  };
  setAddressFlag = (address: string, flag: number) => {
    this.store.addressFlags = Object.assign({}, this.store.addressFlags, {
      [address]: flag,
    });
  };

  // keyringAlianNames
  setKeyringAlianName = (keyringKey: string, name: string) => {
    this.store.keyringAlianNames = Object.assign(
      {},
      this.store.keyringAlianNames,
      { [keyringKey]: name }
    );
  };

  getKeyringAlianName = (keyringKey: string, defaultName?: string) => {
    const name = this.store.keyringAlianNames[keyringKey];
    if (!name && defaultName) {
      this.store.keyringAlianNames[keyringKey] = defaultName;
    }
    return this.store.keyringAlianNames[keyringKey];
  };

  getCurrentAccount = () => {
    return cloneDeep(this.store.currentAccount);
  };

  setCurrentAccount = (account?: Account | null) => {
    this.store.currentAccount = account;
    if (account) {
      sessionService.broadcastEvent('accountsChanged', [account.address]);
      eventBus.emit(EVENTS.broadcastToUI, {
        method: 'accountsChanged',
        params: account,
      });
    }
  };

  setNetworkType = (networkType: NetworkType) => {
    this.store.networkType = networkType;
  };

  getNetworkType = () => {
    return this.store.networkType;
  };

  // currentKeyringIndex
  getCurrentKeyringIndex = () => {
    return this.store.currentKeyringIndex;
  };

  setCurrentKeyringIndex = (keyringIndex: number) => {
    this.store.currentKeyringIndex = keyringIndex;
  };
}

export default new PreferenceService();
