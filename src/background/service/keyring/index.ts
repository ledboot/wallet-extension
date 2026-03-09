// @ts-expect-error - browser-passworder 没有类型定义
import encryptor from 'browser-passworder';
import { EventEmitter } from 'eventemitter3';

import { CHAIN_INFO, EVENTS, KEYRING_TYPE } from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import { ObservableStore } from '@/shared/observableStore';
import { Account } from '@/shared/types';

import assetService from '../asset';
import { preferenceService } from '../index';
import DisplayKeyring from './display';
import { SimpleKeyring } from './simpleKeyring';

const KEYRING_SDK_TYPES = new Map([[KEYRING_TYPE.SimpleKeyring, SimpleKeyring]]);

interface MemStoreState {
  isUnlocked: boolean;
  keyringTypes: string[];
  keyrings: any[];
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
    const keyring = await this.addNewKeyring(KEYRING_TYPE.SimpleKeyring, [[privateKeyHex, compressed]]);
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
  checkForDuplicate = (type: string, newAccountArray: string[]): string[] => {
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
      throw new Error(`Keyring ${keyring.type} does_not_support_account_removal_operations`);
    }

    // Get account key before removing (for preference cleanup)
    const accounts = await keyring.getAccounts();

    const accountToRemove = accounts.find((acc) => acc.address === address);
    const accountKey = accountToRemove?.key;

    keyring.removeAccount(address);
    this.cachedDisplayedKeyring = null;

    // Clean up UTXO data for this account
    assetService.removeAccountUtxoData(address);

    // Clean up preference data for this account
    if (accountKey) {
      // Check if the key exists in accountAlianNames
      const hasKey = accountKey in preferenceService.store.accountAlianNames;

      if (hasKey) {
        preferenceService.removeAccountAlianName(accountKey);
      } else {
        // Try to find matching keys by address pattern
        const matchingKeys = Object.keys(preferenceService.store.accountAlianNames).filter(
          (key) => key.includes(address) || key.includes(accountToRemove?.alianName || '')
        );

        matchingKeys.forEach((key) => {
          preferenceService.removeAccountAlianName(key);
        });
      }
    }

    this.emit('removedAccount', address);
    await this.persistAllKeyrings();
    this.updateMemStoreKeyrings();
    await this.fullUpdate();
  };

  removeKeyring = async (keyringKey: string) => {
    const index = this.getKeyringIndexByKey(keyringKey);

    if (index === -1) {
      throw new Error(`keyring_not_found: ${keyringKey}`);
    }

    // Get the keyring reference before removing it
    const keyringToRemove = this.keyrings[index];

    // Clean up UTXO data for all accounts in this keyring FIRST
    const tmpKeyring = this.keyrings[index];
    if (tmpKeyring) {
      const accounts = tmpKeyring.getAccounts();
      accounts.forEach((account) => assetService.removeAccountUtxoData(account.address));
    }

    // Clean up preference data for this keyring
    preferenceService.removeKeyringAlianName(keyringKey);

    // Now remove the keyring from array
    const removedKeyring = this.keyrings[index];
    this.keyrings.splice(index, 1);
    this.cachedDisplayedKeyring = null;

    // Persist the changes
    await this.persistAllKeyrings();
    this.updateMemStoreKeyrings();
    await this.fullUpdate();
    return removedKeyring;
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

  getDisplayedKeyringByKey = (key: string): Promise<DisplayedKeyring | undefined> => {
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
  getKeyringForAccount = (address: string, type: string = KEYRING_TYPE.SimpleKeyring): Keyring => {
    console.log('getKeyringForAccount', address, type);
    const keyrings = type ? this.keyrings.filter((keyring) => keyring.type === type) : this.keyrings;
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
  displayForKeyring = (keyring: Keyring, index: number): DisplayedKeyring => {
    return {
      type: keyring.type,
      key: keyring.key,
      keyring: new DisplayKeyring(keyring),
      accounts: keyring.getAccounts(),
      index,
    };
  };

  getAllDisplayedKeyrings = async (resetCache?: boolean): Promise<DisplayedKeyring[]> => {
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
    const keyrings = this.keyrings.map((keyring, index) => this.displayForKeyring(keyring, index));
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
  };
}

export default new KeyringService();
