import { compareVersions } from 'compare-versions';

import {
  ChainType,
  DEFAULT_LOCKTIME_ID,
  NetworkType,
} from '@/shared/constants';
import { ChainInfo } from '@/shared/types';

import createPersistStore from '../utils/persisitStore';

export interface PreferenceStore {
  currentKeyringKey: string;
  currentAccountIndex: number;
  locale: string;
  networkType: NetworkType;
  chainType: ChainType;
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
  chainInfo: { [key: string]: ChainInfo }; // 添加动态网络配置存储
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
        locale: 'en',
        networkType: NetworkType.MAINNET,
        chainType: ChainType.ZENT_MAINNET,
        // networkType: NetworkType.TESTNET,
        // chainType: ChainType.ZENT_TESTNET,
        currentVersion: '0',
        firstOpen: false,
        enableSignData: false,
        autoLockTimeId: DEFAULT_LOCKTIME_ID,
        openInSidePanel: false,
        accountAlianNames: {},
        addressFlags: {},
        keyringAlianNames: {},
        chainInfo: {}, // 初始化空的 chainInfo 存储
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

  // Remove account alias name
  removeAccountAlianName = (accountKey: string) => {
    const newAccountAlianNames = { ...this.store.accountAlianNames };
    delete newAccountAlianNames[accountKey];
    this.store.accountAlianNames = newAccountAlianNames;
  };

  // Remove keyring alias name
  removeKeyringAlianName = (keyringKey: string) => {
    const newKeyringAlianNames = { ...this.store.keyringAlianNames };
    delete newKeyringAlianNames[keyringKey];
    this.store.keyringAlianNames = newKeyringAlianNames;
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

  // ChainInfo 管理方法
  addchainInfo = (chainType: string, chainInfo: ChainInfo) => {
    // 直接修改 store 对象以触发 Proxy 的 set 陷阱
    this.store.chainInfo[chainType] = chainInfo;
    
    // 强制触发存储更新
    const updatedChainInfo = { ...this.store.chainInfo };
    this.store.chainInfo = updatedChainInfo;
    
    console.log(`Added chain ${chainType} to preference store`);
  };

  getchainInfo = (chainType: string): ChainInfo | undefined => {
    return this.store.chainInfo[chainType];
  };

  getAllchainInfo = (): { [key: string]: ChainInfo } => {
    return this.store.chainInfo;
  };

  removechainInfo = (chainType: string) => {
    delete this.store.chainInfo[chainType];
  };
}

export default new PreferenceService();
