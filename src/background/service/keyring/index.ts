// @ts-expect-error - browser-passworder 没有类型定义
import encryptor from 'browser-passworder';
import { EventEmitter } from 'eventemitter3';

import { EVENTS, KEYRING_TYPE } from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import { ObservableStore } from '@/shared/observableStore';
import { Account, CoinNames, Utxo, UtxoAddressSumInfo } from '@/shared/types';

import DisplayKeyring from './display';
import { SimpleKeyring } from './simpleKeyring';
import createPersistStore from '@background/utils/persisitStore';

const KEYRING_SDK_TYPES = new Map([
  [KEYRING_TYPE.SimpleKeyring, SimpleKeyring],
]);

interface MemStoreState {
  isUnlocked: boolean;
  keyringTypes: string[];
  keyrings: any[];
}
export type UtxosMap = {
  [key: string]: {  // key 格式为 "address_chainId"
    utxos: Utxo[];
  };
};
// interface KeyringState {

//   utxosMap: Map<string, Utxo[]>;// address_chainid: Utxo[]
//   utxoSumsMap: Map<string, UtxoAddressSumInfo[]>;// address_chainid_tokenType: UtxoAddressSumInfo[]
// }

interface KeyringState {
  utxoSums: UtxoAddressSumInfo[];
  CoinNames: CoinNames[];
  utxos: Utxo[];
  utxosMap: Map<string, Utxo[]>;// address_chainid: Utxo[]
  utxoSumsMap: Map<string, UtxoAddressSumInfo[]>;// address_chainid_tokenType: UtxoAddressSumInfo[]
}

export interface DisplayedKeyring {
  type: string;
  key: string;
  keyring: DisplayKeyring;
  accounts: Account[];
  index: number;
}

export interface ToSignInput {
  index: number;
  publicKey: string;
}
export interface Keyring {
  type: string;
  key: string;
  serialize(): any;
  deserialize(opts: any): Promise<void>;
  addAccounts(n: number): string[];
  getAccounts(): Account[];
  exportAccount(address: string): string;
  exportPrivateKeyHex(address: string): string;
  exportPrivateKey(address: string): string;
  removeAccount(address: string): void;
  getIndexByAddress(address: string): number;
  activeAccount(index: number): Account;
  generatePrePrivateKey(): { address: string; wif: string };
}

class KeyringService extends EventEmitter {
  //
  // PUBLIC METHODS
  //
  keyringTypes: string[];
  store!: ObservableStore<any>;
  memStore: ObservableStore<MemStoreState>;
  keyrings: Keyring[];
  encryptor: typeof encryptor = encryptor;
  password: string | null = null;
  private isUnlocking = false;
  private cachedDisplayedKeyring: DisplayedKeyring[] | null = null;

  constructor() {
    super();
    this.keyringTypes = Array.from(KEYRING_SDK_TYPES.keys());
    this.memStore = new ObservableStore({
      isUnlocked: false,
      keyringTypes: this.keyringTypes,
      keyrings: [],
    });

    this.keyrings = [];
  }

  loadStore = (initState: any) => {
    this.store = new ObservableStore(initState);
  };

  boot = async (password: string) => {
    this.password = password;
    const encryptBooted = await this.encryptor.encrypt(password, 'true');
    this.store.updateState({ booted: encryptBooted });
    this.memStore.updateState({ isUnlocked: true });
  };

  isBooted = () => {
    return !!this.store.getState().booted;
  };

  hasVault = () => {
    return !!this.store.getState().vault;
  };

  /**
   * Full Update
   *
   * Emits the `update` event and @returns a Promise that resolves to
   * the current state.
   *
   * Frequently used to end asynchronous chains in this class,
   * indicating consumers can often either listen for updates,
   * or accept a state-resolving promise to consume their results.
   *
   * @returns {Object} The controller state.
   */
  fullUpdate = (): MemStoreState => {
    this.emit('update', this.memStore.getState());
    return this.memStore.getState();
  };

  /**
   * Import Keychain using Private key
   *
   * @emits KeyringController#unlock
   * @param  privateKeyHex - The privateKey to generate address
   * @returns  A Promise that resolves to the state.
   */
  importPrivateKey = async (privateKeyHex: string, compressed: boolean) => {
    const keyring = await this.addNewKeyring(KEYRING_TYPE.SimpleKeyring, [[
      privateKeyHex,
      compressed,
    ]]);
    this.setUnlocked();
    this.fullUpdate();
    return keyring;
  };

  getKeyringByType = (type: string) => {
    const keyring = this.keyrings.find((k) => k.type === type);
    return keyring;
  };

  getKeyringIndexByKey = (key: string) => {
    return this.keyrings.findIndex((k) => k.key === key);
  };

  /**
   * 切换当前keyring
   * @param keyringKey keyring的key
   */
  changeKeyring = async (keyringKey: string): Promise<void> => {
    const index = this.getKeyringIndexByKey(keyringKey);
    if (index === -1) {
      return Promise.reject(new Error('keyring_not_found'));
    }
    await this.fullUpdate();
  };

  addKeyring = async (keyring: Keyring) => {
    const accounts = keyring.getAccounts();
    const accountAddresses = accounts.map((account) => account.addressHex);
    this.checkForDuplicate(keyring.type, accountAddresses);

    this.keyrings.push(keyring);
    this.cachedDisplayedKeyring = null;

    await this.persistAllKeyrings();
    this.updateMemStoreKeyrings();
    this.fullUpdate();
    return keyring;
  };

  /**
   * Set Locked
   * This method deallocates all secrets, and effectively locks MetaMask.
   *
   * @emits KeyringController#lock
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  setLocked = async (): Promise<MemStoreState> => {
    // set locked
    console.log('setLocked');
    this.password = null;
    this.memStore.updateState({ isUnlocked: false });

    // remove keyrings
    this.keyrings = [];
    this.cachedDisplayedKeyring = null;

    this.updateMemStoreKeyrings();
    this.emit('lock');
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'lock',
      params: {},
    });
    return this.fullUpdate();
  };

  /**
   * Submit Password
   *
   * Attempts to decrypt the current vault and load its keyrings
   * into memory.
   *
   * Temporarily also migrates any old-style vaults first, as well.
   * (Pre MetaMask 3.0.0)
   *
   * @emits KeyringController#unlock
   * @param {string} password - The keyring controller password.
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  submitPassword = async (password: string): Promise<MemStoreState> => {
    if (this.isUnlocking) {
      return Promise.reject(new Error('unlock_already_in_progress'));
    }

    this.isUnlocking = true;

    try {
      await this.verifyPassword(password);
      this.password = password;

      this.keyrings = await this.unlockKeyrings(password);
      this.cachedDisplayedKeyring = null;

      this.setUnlocked();
      return this.fullUpdate();
    } finally {
      this.isUnlocking = false;
    }
  };

  changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    if (this.isUnlocking) {
      return Promise.reject(new Error('change_password_already_in_progress'));
    }
    this.isUnlocking = true;

    await this.verifyPassword(oldPassword);
    await this.unlockKeyrings(oldPassword);
    this.password = newPassword;

    const encryptBooted = await this.encryptor.encrypt(newPassword, 'true');
    this.store.updateState({ booted: encryptBooted });

    await this.persistAllKeyrings();
    this.updateMemStoreKeyrings();
    this.fullUpdate();
    this.isUnlocking = false;
  };

  /**
   * Verify Password
   *
   * Attempts to decrypt the current vault with a given password
   * to verify its validity.
   *
   * @param {string} password
   */
  verifyPassword = async (password: string): Promise<void> => {
    const encryptedBooted = this.store.getState().booted;
    if (!encryptedBooted) {
      return Promise.reject(new Error('cannot_unlock_without_a_previous_vault'));
    }
    await this.encryptor.decrypt(password, encryptedBooted);
  };

  /**
   * Add New Keyring
   *
   * Adds a new Keyring of the given `type` to the vault
   * and the current decrypted Keyrings array.
   *
   * All Keyring classes implement a unique `type` string,
   * and this is used to retrieve them from the keyringTypes array.
   *
   * @param  type - The type of keyring to add.
   * @param  opts - The constructor options for the keyring.
   * @returns  The new keyring.
   */
  addNewKeyring = async (type: string, opts: unknown): Promise<Keyring> => {
    const Keyring = this.getKeyringClassForType(type);
    const keyring = new Keyring();
    await keyring.deserialize(opts);
    keyring.key = Date.now().toString();
    return await this.addKeyring(keyring);
  };

  createTmpKeyring = async (type: string, opts: unknown) => {
    const Keyring = this.getKeyringClassForType(type);
    const keyring = new Keyring();
    if (opts && Array.isArray(opts) && opts.length > 0) {
      await keyring.deserialize(opts);
    }
    keyring.key = Date.now().toString();
    return keyring;
  };

  /**
   * Checks for duplicate keypairs, using the the first account in the given
   * array. Rejects if a duplicate is found.
   *
   * Only supports 'Simple Key Pair'.
   *
   * @param {string} type - The key pair type to check for.
   * @param {Array<string>} newAccountArray - Array of new accounts.
   * @returns {Array<string>} The account, if no duplicate is found.
   */
  checkForDuplicate = (
    type: string,
    newAccountArray: string[]
  ): string[] => {
    const keyrings = this.getKeyringsByType(type);
    const _accounts = keyrings.map((keyring) => keyring.getAccounts());

    const accounts: string[] = _accounts.reduce(
      (m, n) => m.concat(n.map((account) => account.addressHex)),
      [] as string[]
    );

    const isIncluded = newAccountArray.some((account) => {
      return accounts.find((key) => key === account);
    });
    if (isIncluded) {
      throw new Error('wallet_existed');
    }

    return newAccountArray;
  };

  /**
   * Add New Account
   *
   * Calls the `addAccounts` method on the given keyring,
   * and then saves those changes.
   *
   * @param {Keyring} selectedKeyring - The currently selected keyring.
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  addNewAccount = async (selectedKeyring: Keyring): Promise<string[]> => {
    const accounts = selectedKeyring.addAccounts(1);
    this.cachedDisplayedKeyring = null;

    accounts.forEach((hexAccount) => {
      this.emit('newAccount', hexAccount);
    });
    await this.persistAllKeyrings();
    this.updateMemStoreKeyrings();
    this.fullUpdate();
    return accounts;
  };

  /**
   * Export Account
   *
   * Requests the private key from the keyring controlling
   * the specified address.
   *
   * Returns a Promise that may resolve with the private key string.
   *
   * @param {string} address - The address of the account to export.
   * @returns {Promise<string>} The private key of the account.
   */
  exportAccount = (address: string): string => {
    const keyring = this.getKeyringForAccount(address);
    const wif = keyring.exportAccount(address);
    return wif;
  };

  exportPrivateKeyHex = (address: string): string => {
    const keyring = this.getKeyringForAccount(address);
    const privateKeyHex = keyring.exportPrivateKeyHex(address);
    return privateKeyHex;
  };

  exportPrivateKey = (address: string): string => {
    const keyring = this.getKeyringForAccount(address);
    const privateKey = keyring.exportPrivateKey(address);
    return privateKey;
  };

  /**
   *
   * Remove Account
   *
   * Removes a specific account from a keyring
   * If the account is the last/only one then it also removes the keyring.
   *
   * @param {string} address - The address of the account to remove.
   * @returns {Promise<void>} A Promise that resolves if the operation was successful.
   */
  removeAccount = async (address: string, type: string): Promise<any> => {
    const keyring = await this.getKeyringForAccount(address, type);

    // Not all the keyrings support this, so we have to check
    if (typeof keyring.removeAccount != 'function') {
      throw new Error(
        `Keyring ${keyring.type} does_not_support_account_removal_operations`
      );
    }
    keyring.removeAccount(address);
    this.cachedDisplayedKeyring = null;

    this.emit('removedAccount', address);
    await this.persistAllKeyrings();
    this.updateMemStoreKeyrings();
    await this.fullUpdate();
  };

  removeKeyring = async (keyringKey: string) => {
    const index = this.getKeyringIndexByKey(keyringKey);
    if (index === -1) {
      throw new Error('keyring_not_found');
    }
    const keyringIndex = this.keyrings.findIndex((k) => k.key === keyringKey);

    delete this.keyrings[keyringIndex];
    this.cachedDisplayedKeyring = null;

    await this.persistAllKeyrings();
    this.updateMemStoreKeyrings();
    await this.fullUpdate();
  };

  /**
   * Persist All Keyrings
   *
   * Iterates the current `keyrings` array,
   * serializes each one into a serialized array,
   * encrypts that array with the provided `password`,
   * and persists that encrypted string to storage.
   *
   * @param {string} password - The keyring controller password.
   * @returns {Promise<boolean>} Resolves to true once keyrings are persisted.
   */
  persistAllKeyrings = async (): Promise<void> => {
    if (!this.password || typeof this.password !== 'string') {
      return Promise.reject(new Error('invalid_password'));
    }

    const serializedKeyrings = this.keyrings.map((keyring) => {
      return {
        type: keyring.type,
        key: keyring.key,
        data: keyring.serialize(),
      };
    });

    const encryptedString = await this.encryptor.encrypt(
      this.password as string,
      serializedKeyrings as unknown as Buffer
    );

    this.store.updateState({ vault: encryptedString });


    // return Promise.all(
    //   this.keyrings.map((keyring) => {
    //     return Promise.all([
    //       keyring.type,
    //       keyring.key,
    //       keyring.serialize(),
    //     ]).then((serializedKeyringArray) => {
    //       return {
    //         type: serializedKeyringArray[0],
    //         key: serializedKeyringArray[1],
    //         data: serializedKeyringArray[2],
    //       };
    //     });
    //   })
    // )
    //   .then((serializedKeyrings) => {
    //     return this.encryptor.encrypt(
    //       this.password as string,
    //       serializedKeyrings as unknown as Buffer
    //     );
    //   })
    //   .then((encryptedString) => {
    //     this.store.updateState({ vault: encryptedString });
    //     return true;
    //   });
  };

  /**
   * Unlock Keyrings
   *
   * Attempts to unlock the persisted encrypted storage,
   * initializing the persisted keyrings to RAM.
   *
   * @param {string} password - The keyring controller password.
   * @returns {Promise<Array<Keyring>>} The keyrings.
   */
  unlockKeyrings = async (password: string): Promise<any[]> => {
    const encryptedVault = this.store.getState().vault;
    if (!encryptedVault) {
      eventBus.emit(EVENTS.broadcastToUI, {
        method: 'initVault',
        params: {},
      });
      return [];
    }
    // TODO: 从preferenceService中获取上次激活的keyring index，如果获取不到，则默认激活第一个keyring

    this.clearKeyrings();
    const vault = await this.encryptor.decrypt(password, encryptedVault);
    const arr = Array.from(vault as unknown as Iterable<unknown>);
    for (let i = 0; i < arr.length; i++) {
      try {
        const { keyring } = await this._restoreKeyring(arr[i]);
        this.keyrings.push(keyring);
      } catch (error) {
        console.error('Error restoring keyring:', error);
        return Promise.reject(error);
      }
    }
    this.cachedDisplayedKeyring = null;

    this.updateMemStoreKeyrings();
    return this.keyrings;
  };

  /**
   * Restore Keyring
   *
   * Attempts to initialize a new keyring from the provided serialized payload.
   * On success, updates the memStore keyrings and returns the resulting
   * keyring instance.
   *
   * @param {Object} serialized - The serialized keyring.
   * @returns {Keyring} The deserialized keyring.
   */
  restoreKeyring = async (serialized: any) => {
    const { keyring } = await this._restoreKeyring(serialized);
    this.updateMemStoreKeyrings();
    return keyring;
  };

  /**
   * Restore Keyring Helper
   *
   * Attempts to initialize a new keyring from the provided serialized payload.
   * On success, returns the resulting keyring instance.
   *
   * @param {Object} serialized - The serialized keyring.
   * @returns {Keyring} The deserialized keyring.
   */
  _restoreKeyring = async (serialized: any): Promise<{ keyring: Keyring }> => {
    const { type, key, data } = serialized;
    const Keyring = this.getKeyringClassForType(type);
    const keyring = new Keyring();
    await keyring.deserialize(data);
    keyring.key = key;
    return { keyring };
  };

  /**
   * Get Keyring Class For Type
   *
   * Searches the current `keyringTypes` array
   * for a Keyring class whose unique `type` property
   * matches the provided `type`,
   * returning it if it exists.
   *
   * @param {string} type - The type whose class to get.
   * @returns {Keyring|undefined} The class, if it exists.
   */
  getKeyringClassForType = (type: string) => {
    const keyring = KEYRING_SDK_TYPES.get(type);
    if (!keyring) {
      throw new Error('keyring_not_found');
    }
    return keyring;
  };

  /**
   * Get Keyrings by Type
   *
   * Gets all keyrings of the given type.
   *
   * @param {string} type - The keyring types to retrieve.
   * @returns {Array<Keyring>} The keyrings.
   */
  getKeyringsByType = (type: string): Keyring[] => {
    return this.keyrings.filter((keyring) => keyring.type === type);
  };

  getDisplayedKeyringByKey = (
    key: string
  ): Promise<DisplayedKeyring | undefined> => {
    return this.getAllDisplayedKeyrings().then((keyrings) => {
      return keyrings.find((keyring) => keyring.key === key);
    });
  };

  /**
   * Get Accounts
   *
   * Returns the public addresses of all current accounts
   * managed by all currently unlocked keyrings.
   *
   * @returns {Promise<Array<string>>} The array of accounts.
   */
  getAccounts = async (): Promise<Account[]> => {
    const keyrings = this.keyrings || [];
    const accounts: Account[] = [];
    for (let i = 0; i < keyrings.length; i++) {
      const keyring = keyrings[i];
      const keyringAccounts = await keyring.getAccounts();
      accounts.push(...keyringAccounts);
    }
    return accounts;
  };

  /**
   * Get Keyring For Account
   *
   * Returns the currently initialized keyring that manages
   * the specified `address` if one exists.
   *
   * @param {string} address - An account address.
   * @returns {Promise<Keyring>} The keyring of the account, if it exists.
   */
  getKeyringForAccount = (
    address: string,
    type?: string
  ): Keyring => {
    const keyrings = type
      ? this.keyrings.filter((keyring) => keyring.type === type)
      : this.keyrings;
    for (let i = 0; i < keyrings.length; i++) {
      const keyring = keyrings[i];
      const accounts = keyring.getAccounts();
      if (accounts.some((account) => account.address === address)) {
        return keyring;
      }
    }
    throw new Error('no_keyring_found_for_the_requested_account');
  };

  /**
   * Display For Keyring
   *
   * Is used for adding the current keyrings to the state object.
   * @param {Keyring} keyring
   * @returns {Promise<Object>} A keyring display object, with type and accounts properties.
   */
  displayForKeyring = (
    keyring: Keyring,
    index: number
  ): DisplayedKeyring => {
    return {
      type: keyring.type,
      key: keyring.key,
      keyring: new DisplayKeyring(keyring),
      accounts: keyring.getAccounts(),
      index,
    };
  };

  getAllDisplayedKeyrings = async (
    resetCache?: boolean
  ): Promise<DisplayedKeyring[]> => {
    if (resetCache || !this.cachedDisplayedKeyring) {
      this.cachedDisplayedKeyring = await Promise.all(
        this.keyrings.map((keyring, index) => {
          return this.displayForKeyring(keyring, index);
        })
      );
    }
    return this.cachedDisplayedKeyring;
  };

  getAllPubkeys = async () => {
    const keyrings = await this.getAllDisplayedKeyrings();
    const result: { pubkey: string; type: string }[] = [];
    keyrings.forEach((accountGroup) => {
      result.push(
        ...accountGroup.keyring.accounts.map((account) => ({
          pubkey: account.pubkey,
          type: accountGroup.type,
        }))
      );
    });

    return result;
  };

  hasPubkey = async (pubkey: string) => {
    const addresses = await this.getAllPubkeys();
    return !!addresses.find((item) => item.pubkey === pubkey);
  };

  /**
   * Clear Keyrings
   *
   * Deallocates all currently managed keyrings and accounts.
   * Used before initializing a new vault.
   */
  /* eslint-disable require-await */
  clearKeyrings = (): void => {
    // clear keyrings from memory

    this.keyrings = [];
    this.cachedDisplayedKeyring = null;

    this.memStore.updateState({
      keyrings: [],
    });
  };

  /**
   * Update Memstore Keyrings
   *
   * Updates the in-memory keyrings, without persisting.
   */
  updateMemStoreKeyrings = (): void => {
    const keyrings = this.keyrings.map((keyring, index) =>
      this.displayForKeyring(keyring, index)
    );
    this.emit('updateKeyrings');
    this.memStore.updateState({ keyrings });
  };

  /**
   * Unlock Keyrings
   *
   * Unlocks the keyrings.
   *
   * @emits KeyringController#unlock
   */
  setUnlocked = () => {
    this.memStore.updateState({ isUnlocked: true });
    this.emit('unlock');
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'unlock',
      params: {},
    });
  };

  changeNetwork = () => {
    this.cachedDisplayedKeyring = null;
  }


  // 批量添加 Utxos, newUtxos新增的
  updateUtxos = (newUtxos: Utxo[]) => {
    // const { UtxoCoin } = this.store.getState();
    // const updatedUtxos = [...(UtxoCoin.utxos || []), ...utxos];
    this.store.updateState({ utxos: newUtxos })

  };
  // 获取所有 Utxos
  getUtxos = (): Utxo[] => {
    return this.store.getState().utxos || [];
  };
  // 根据地址获取 UTXOs
  // getUTXOsByAddress = (address: string): Utxo[] => {
  //   const { keyringState } = this.store.getState();
  //   return (keyringState.utxos || []).filter((utxo: { address: string; }) => utxo.address === address);
  // };
  // 移除特定 UTXO
  removeUtxo = (rmTxid: string, rmIndex: number) => {
    const utxos = this.getUtxos().filter(({ txid, index }) => !(txid === rmTxid && index === rmIndex));

    this.store.updateState({
      utxos: utxos
    });
  };
  // 清空所有 UTXOs
  clearUtxos = (): void => {

    this.store.updateState({
      utxos: []
    });
  };
  // // 更新 UTXO
  // updateUTXO = (updatedUtxos: Utxo | Utxo[]) => {
  //   const { UtxoCoin } = this.store.getState();
  //   const currentUtxos = UtxoCoin.utxos || [];

  //   // 将单个 UTXO 转换为数组以统一处理
  //   const utxosToUpdate = Array.isArray(updatedUtxos) ? updatedUtxos : [updatedUtxos];

  //   // 创建现有 UTXO 的映射以便快速查找
  //   const utxoMap = new Map(currentUtxos.map((utxo: { txid: any; }) => [`${utxo.txid}`, utxo]));

  //   // 更新或添加新的 UTXO
  //   utxosToUpdate.forEach(utxo => {
  //     const key = `${utxo.txid}`;
  //     utxoMap.set(key, utxo);
  //   });

  //   // 转换回数组
  //   const finalUtxos = Array.from(utxoMap.values());

  //   // 更新状态
  //   this.store.updateState({
  //     UtxoCoin: {
  //       ...UtxoCoin,
  //       utxos: finalUtxos
  //     }
  //   });
  // };

  updateUtxoSum = (newSums: UtxoAddressSumInfo[]) => {
    this.store.updateState({
      utxoSum: newSums
    });
  };

  getUtxoSum = (): UtxoAddressSumInfo[] => {
    return this.store.getState().utxoSum || [];
  };

  removeUtxoSum = (rmAddress: string, rmChainId: number) => {
    const newSums = this.getUtxoSum().filter(({ address, chainId }) => !(address === rmAddress && chainId === rmChainId));

    this.store.updateState({
      utxoSum: newSums
    });
  };

  addCoinName = (coinName: CoinNames[]) => {

    this.store.updateState({
      coinName: coinName
    });

  };
  getCoinNames = (): CoinNames[] => {
    return this.store.getState().coinName || [];
  };
  removeCoinName = (rmTokenType: string, rmChainId: number) => {
    const coinName = this.getCoinNames().filter(({ tokenType, chainId }) => !(tokenType === rmTokenType && chainId === rmChainId));

    this.store.updateState({
      coinName: coinName
    });
  };
  // updateCoinName = (updatedCoins: CoinNames[]): CoinNames[] => {
  //   const { UtxoCoin } = this.store.getState();
  //   const CoinNames = UtxoCoin.CoinNames || [];
  //   let hasChanges = false;
  //   updatedCoins.forEach(updatedCoin => {
  //     const existingIndex = CoinNames.findIndex(
  //       (coin: { tokenType: string; chainId: number; }) =>
  //         coin.tokenType === updatedCoin.tokenType &&
  //         coin.chainId === updatedCoin.chainId
  //     );

  //     if (existingIndex >= 0) {
  //       // 更新已存在的币种
  //       if (JSON.stringify(CoinNames[existingIndex]) !== JSON.stringify(updatedCoin)) {
  //         CoinNames[existingIndex] = updatedCoin;
  //         hasChanges = true;
  //       }
  //     } else {
  //       // 添加新币种
  //       CoinNames.push(updatedCoin);
  //       hasChanges = true;
  //     }
  //   });

  //   if (hasChanges) {
  //     this.store.updateState({
  //       UtxoCoin: {
  //         ...UtxoCoin,
  //         CoinNames
  //       }
  //     });
  //   }

  //   return CoinNames;
  // };


  addUtxosMap(address: string, chainId: number, utxo: Utxo[]) {
    const key = `${address}_${chainId}`;
    // const existingUTXOs = UtxoCoin.utxosMap.get(key) || [];
    // UtxoCoin.utxosMap.set(key, [...existingUTXOs, utxo]);

    // // 获取现有的 UTXOs
    // const existingUTXOs = UtxoCoin.utxosMap?.get(key) || [];

    // // 创建新的 Map 实例以保持不可变性
    // const newUtxosMap = new Map(UtxoCoin.utxosMap || []);

    // // 更新指定键的值
    // newUtxosMap.set(key, [...existingUTXOs, ...utxo]);

    //   const existingUtxoIds = new Set(
    //   existingUtxos.map(u => `${u.txid}_${u.index}`)
    // );
    //   const utxoAllMap = this.getUtxosAllMap()
    //   const utxoAllMapFilter = utxoAllMap.filter(key)
    const utxoAllMap = this.store.getState().utxoMap || {}
    const originKeyMap = utxoAllMap[key]

    this.store.updateState({
      utxoMap: {
        ...(utxoAllMap),
        [key]: {
          ...(originKeyMap || []), ...utxo
        }
      }
    })
  }
  getUtxosMap = (address: string, chainId: number): Utxo[] => {
    const utxos = this.store.getState().utxoMap[`${address}_${chainId}`];
    return utxos || [];
  };

  getUtxosAllMap = (): Utxo[] => {
    return this.store.getState().utxoMap || [];
  };

}

export default new KeyringService();
