import { compareVersions } from 'compare-versions';

import { ChainType, DEFAULT_LOCKTIME_ID, NetworkType } from '@/shared/constants';
import {
  AnexBalance,
  TxHistoryItem,
  UtxoAddressSumInfo,
  CoinNames,
  Utxo,
} from '@/shared/types';

import createPersistStore from '../utils/persisitStore';

export interface PreferenceStore {
  currentKeyringKey: string;
  currentAccountIndex: number;
  balance: AnexBalance;
  locale: string;
  networkType: NetworkType;
  chainType: ChainType;
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
  // utxoSums: UtxoAddressSumInfo[];
  // CoinNames: CoinNames[];
  // utxos: Utxo[];
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
        currentKeyringKey: '',
        currentAccountIndex: 0,
        balance: {
          amount: 0n,
        },
        locale: 'en',
        // networkType: NetworkType.MAINNET,
        // chainType: ChainType.ZENT_MAINNET,
        networkType: NetworkType.TESTNET,
        chainType: ChainType.ZENT_TESTNET,
        currentVersion: '0',
        firstOpen: false,
        txHistory: [],
        enableSignData: false,
        autoLockTimeId: DEFAULT_LOCKTIME_ID,
        openInSidePanel: false,
        accountAlianNames: {},
        addressFlags: {},
        keyringAlianNames: {},
        // utxoSums: [],
        // CoinNames: [],
        // utxos: [],
      },
    });

    // if (!Array.isArray(this.store.utxoSums)) {
    //   this.store.utxoSums = [];
    //   this.store.utxoSums = [...this.store.utxoSums]; // 强制保存
    // }
    if (typeof this.store.autoLockTimeId !== 'number') {
      this.store.autoLockTimeId = DEFAULT_LOCKTIME_ID;
    }
    // if (!Array.isArray(this.store.utxos)) {
    //   this.store.utxos = [];
    //   this.store.utxos = [...this.store.utxos]; // 强制保存
    //   console.log('utxos', this.store.utxos);
    // }
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

  setNetworkType = (networkType: NetworkType) => {
    this.store.networkType = networkType;
  };

  getNetworkType = () => {
    return this.store.networkType;
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

  getChainType = () => {
    return this.store.chainType;
  };

  setChainType = (chainTyp: ChainType) => {
    this.store.chainType = chainTyp;
  };

  // CoinNames management
  // setConames = (CoinNames: CoinNames[]) => {
  //   this.store.CoinNames = CoinNames;
  // };

  // getConames = () => {
  //   return this.store.CoinNames || [];
  // };

  // // UTXOs management
  // setUtxos = (utxos: Utxo[]) => {
  //   this.store.utxos = utxos;
  // };

  // getUtxos = (): Utxo[] => {
  //   return this.store.utxos || [];
  // };

  // updateUtxos = (newUtxos: Utxo[]) => {
  //   // Create a map of existing UTXOs for quick lookup
  //   const utxoMap = new Map(
  //     this.store.utxos.map(utxo => [`${utxo.txid}:${utxo.index}`, utxo])
  //   );

  //   // Add or update UTXOs
  //   newUtxos.forEach(utxo => {
  //     utxoMap.set(`${utxo.txid}:${utxo.index}`, utxo);
  //   });

  //   // Convert back to array and update the store
  //   this.store.utxos = Array.from(utxoMap.values());
  //   return this.store.utxos;
  // };

  // updateConames = (newConames: CoinNames[]) => {
  //   const existingConames = this.getConames();
  //   const conamesMap = new Map(
  //     existingConames.map(coname => [coname.tokenType, coname])
  //   );

  //   // Update or add new CoinNames
  //   newConames.forEach(coname => {
  //     conamesMap.set(coname.tokenType, coname);
  //   });

  //   this.store.CoinNames = Array.from(conamesMap.values());
  //   return this.store.CoinNames;
  // };

  // setUtxoSums = (utxoSums: UtxoAddressSumInfo[]) => {
  //   this.store.utxoSums = utxoSums;
  // };

  // getUtxoSums = (): UtxoAddressSumInfo[] => {
  //   return this.store.utxoSums || [];
  // };

  // updateUtxoSums = (newSums: UtxoAddressSumInfo[]): UtxoAddressSumInfo[] => {
  //   const existingSums = this.getUtxoSums();
  //   const sumsMap = new Map(
  //     existingSums.map(sum => [`${sum.address}|${sum.tokenType}`, sum])
  //   );

    // Update or add new sums
  //   newSums.forEach(sum => {
  //     sumsMap.set(`${sum.address}|${sum.tokenType}`, sum);
  //   });

  //   this.store.utxoSums = Array.from(sumsMap.values());
  //   return this.store.utxoSums;
  // };
}

export default new PreferenceService();
