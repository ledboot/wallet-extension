// @ts-expect-error - browser-passworder 没有类型定义
import encryptor from 'browser-passworder';
import { EventEmitter } from 'eventemitter3';

import { EVENTS, KEYRING_TYPE } from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import { ObservableStore } from '@/shared/observableStore';

import DisplayKeyring from './display';
import { SimpleKeyring } from './simpleKeyring';

export const KEYRING_SDK_TYPES = {
  SimpleKeyring,
};

export const KEYRING_CLASS = {
  PRIVATE_KEY: SimpleKeyring.type,
};

interface MemStoreState {
  isUnlocked: boolean;
  keyringTypes: any[];
  keyrings: any[];
  preWIF: string;
  preAddress: string;
}

export interface DisplayedKeyring {
  type: string;
  accounts: {
    pubkey: string;
    type?: string;
    keyring?: DisplayKeyring;
  }[];
  keyring: DisplayKeyring;
  index: number;
}

export interface ToSignInput {
  index: number;
  publicKey: string;
}
export interface Keyring {
  type: string;
  serialize(): Promise<any>;
  deserialize(opts: any): Promise<void>;
  addAccounts(n: number): Promise<string[]>;
  getAccounts(): Promise<string[]>;
  exportAccount(address: string): Promise<string>;
  removeAccount(address: string): void;

  accounts?: string[];
  unlock?(): Promise<void>;
  getAddresses?(
    start: number,
    end: number
  ): { address: string; index: number }[];
  getIndexByAddress?(address: string): number;

  activeAccounts?(indexes: number[]): string[];
  generatePrePrivateKey(): any;
}

class EmptyKeyring implements Keyring {
  type = KEYRING_TYPE.Empty;
  constructor() {
    // todo
  }
  accounts?: string[] | undefined;
  unlock?(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getAddresses?(
    start: number,
    end: number
  ): { address: string; index: number }[] {
    throw new Error('Method not implemented.');
  }
  getIndexByAddress?(address: string): number {
    throw new Error('Method not implemented.');
  }
  activeAccounts?(indexes: number[]): string[] {
    throw new Error('Method not implemented.');
  }
  generatePrePrivateKey(): any {
    throw new Error('Method not implemented.');
  }
  async addAccounts(n: number): Promise<string[]> {
    return [];
  }

  async getAccounts(): Promise<string[]> {
    return [];
  }
  exportAccount(address: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  removeAccount(address: string): void {
    throw new Error('Method not implemented.');
  }

  async serialize() {
    return '';
  }

  async deserialize(opts: any) {
    return;
  }
}

class KeyringService extends EventEmitter {
  //
  // PUBLIC METHODS
  //
  keyringTypes: any[];
  store!: ObservableStore<any>;
  memStore: ObservableStore<MemStoreState>;
  keyrings: Keyring[];
  encryptor: typeof encryptor = encryptor;
  password: string | null = null;
  private isUnlocking = false;
  private cachedDisplayedKeyring: DisplayedKeyring[] | null = null;

  constructor() {
    super();
    this.keyringTypes = Object.values(KEYRING_SDK_TYPES);
    this.memStore = new ObservableStore({
      isUnlocked: false,
      keyringTypes: this.keyringTypes.map((krt) => krt.type),
      keyrings: [],
      preWIF: '',
      preAddress: '',
      addressTypes: [],
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
   * @param  privateKey - The privateKey to generate address
   * @returns  A Promise that resolves to the state.
   */
  importPrivateKey = async (privateKey: string) => {
    const keyring = await this.addNewKeyring(KEYRING_TYPE.SimpleKeyring, [
      privateKey,
    ]);
    this.setUnlocked();
    this.fullUpdate();
    return keyring;
  };

  getKeyringByType = (type: string) => {
    const keyring = this.keyrings.find((k) => k.type === type);
    return keyring;
  };

  addKeyring = async (keyring: Keyring) => {
    const accounts = await keyring.getAccounts();
    await this.checkForDuplicate(keyring.type, accounts);

    this.keyrings.push(keyring);
    this.cachedDisplayedKeyring = null;

    await this.persistAllKeyrings();
    await this._updateMemStoreKeyrings();
    await this.fullUpdate();
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
    this.password = null;
    this.memStore.updateState({ isUnlocked: false });

    // remove keyrings
    this.keyrings = [];
    this.cachedDisplayedKeyring = null;

    await this._updateMemStoreKeyrings();
    this.emit('lock');
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
      throw new Error('unlock_already_in_progress');
    }

    this.isUnlocking = true;

    try {
      await this.verifyPassword(password);

      this.password = password;

      this.keyrings = await this.unlockKeyrings(password);
      this.cachedDisplayedKeyring = null;

      this.setUnlocked();
      return this.fullUpdate();
    } catch (e) {
      throw e;
    } finally {
      this.isUnlocking = false;
    }
  };

  changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      if (this.isUnlocking) {
        throw new Error('change_password_already_in_progress');
      }
      this.isUnlocking = true;

      await this.verifyPassword(oldPassword);
      await this.unlockKeyrings(oldPassword);
      this.password = newPassword;

      const encryptBooted = await this.encryptor.encrypt(newPassword, 'true');
      this.store.updateState({ booted: encryptBooted });

      await this.persistAllKeyrings();
      await this._updateMemStoreKeyrings();
      await this.fullUpdate();
    } catch (e) {
      throw new Error('change_password_failed');
    } finally {
      this.isUnlocking = false;
    }
  };

  generatePrePrivateKey = (selectedKeyring: Keyring): any => {
    const { address, wif } = selectedKeyring.generatePrePrivateKey();
    const encryptedWif = this.encryptor.encrypt(this.password, wif);
    this.memStore.updateState({ preWIF: encryptedWif, preAddress: address });
    return { address, wif };
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
      throw new Error('cannot_unlock_without_a_previous_vault');
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
    const keyring = new Keyring(opts);
    return await this.addKeyring(keyring);
  };

  createTmpKeyring = (type: string, opts: unknown) => {
    const Keyring = this.getKeyringClassForType(type);
    const keyring = new Keyring(opts);
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
   * @returns {Promise<Array<string>>} The account, if no duplicate is found.
   */
  checkForDuplicate = async (
    type: string,
    newAccountArray: string[]
  ): Promise<string[]> => {
    const keyrings = this.getKeyringsByType(type);
    const _accounts = await Promise.all(
      keyrings.map((keyring) => keyring.getAccounts())
    );

    const accounts: string[] = _accounts.reduce(
      (m, n) => m.concat(n),
      [] as string[]
    );

    const isIncluded = newAccountArray.some((account) => {
      return accounts.find((key) => key === account);
    });

    return isIncluded
      ? Promise.reject(new Error('wallet_existed'))
      : Promise.resolve(newAccountArray);
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
    const accounts = await selectedKeyring.addAccounts(1);
    this.cachedDisplayedKeyring = null;

    accounts.forEach((hexAccount) => {
      this.emit('newAccount', hexAccount);
    });
    await this.persistAllKeyrings();
    await this._updateMemStoreKeyrings();
    await this.fullUpdate();
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
  exportAccount = async (address: string): Promise<string> => {
    const keyring = await this.getKeyringForAccount(address);
    const privkey = await keyring.exportAccount(address);
    return privkey;
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
    await this._updateMemStoreKeyrings();
    await this.fullUpdate();
  };

  removeKeyring = async (keyringIndex: number): Promise<any> => {
    delete this.keyrings[keyringIndex];
    this.keyrings[keyringIndex] = new EmptyKeyring();
    this.cachedDisplayedKeyring = null;

    await this.persistAllKeyrings();
    await this._updateMemStoreKeyrings();
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
  persistAllKeyrings = (): Promise<boolean> => {
    console.log('persistAllKeyrings', this.password);
    if (!this.password || typeof this.password !== 'string') {
      return Promise.reject(
        new Error('keyringcontroller_password_is_not_a_string')
      );
    }
    return Promise.all(
      this.keyrings.map((keyring, index) => {
        return Promise.all([keyring.type, keyring.serialize()]).then(
          (serializedKeyringArray) => {
            // Label the output values on each serialized Keyring:
            return {
              type: serializedKeyringArray[0],
              data: serializedKeyringArray[1],
            };
          }
        );
      })
    )
      .then((serializedKeyrings) => {
        return this.encryptor.encrypt(
          this.password as string,
          serializedKeyrings as unknown as Buffer
        );
      })
      .then((encryptedString) => {
        this.store.updateState({ vault: encryptedString });
        return true;
      });
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
      throw new Error('cannot_unlock_without_a_previous_vault');
    }

    await this.clearKeyrings();
    const vault = await this.encryptor.decrypt(password, encryptedVault);

    const arr = Array.from(vault as unknown as Iterable<unknown>);
    for (let i = 0; i < arr.length; i++) {
      const { keyring } = await this._restoreKeyring(arr[i]);
      this.keyrings.push(keyring);
    }
    this.cachedDisplayedKeyring = null;

    await this._updateMemStoreKeyrings();
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
   * @returns {Promise<Keyring>} The deserialized keyring.
   */
  restoreKeyring = async (serialized: any) => {
    const { keyring } = await this._restoreKeyring(serialized);
    await this._updateMemStoreKeyrings();
    return keyring;
  };

  /**
   * Restore Keyring Helper
   *
   * Attempts to initialize a new keyring from the provided serialized payload.
   * On success, returns the resulting keyring instance.
   *
   * @param {Object} serialized - The serialized keyring.
   * @returns {Promise<Keyring>} The deserialized keyring.
   */
  _restoreKeyring = async (serialized: any): Promise<{ keyring: Keyring }> => {
    const { type, data } = serialized;
    if (type === KEYRING_TYPE.Empty) {
      const keyring = new EmptyKeyring();
      return { keyring };
    }
    const Keyring = this.getKeyringClassForType(type);
    const keyring = new Keyring();
    await keyring.deserialize(data);

    // getAccounts also validates the accounts for some keyrings
    await keyring.getAccounts();
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
    return this.keyringTypes.find((kr) => kr.type === type);
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

  /**
   * Get Accounts
   *
   * Returns the public addresses of all current accounts
   * managed by all currently unlocked keyrings.
   *
   * @returns {Promise<Array<string>>} The array of accounts.
   */
  getAccounts = async (): Promise<string[]> => {
    const keyrings = this.keyrings || [];
    let addrs: string[] = [];
    for (let i = 0; i < keyrings.length; i++) {
      const keyring = keyrings[i];
      const accounts = await keyring.getAccounts();
      addrs = addrs.concat(accounts);
    }
    return addrs;
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
  getKeyringForAccount = async (
    address: string,
    type?: string,
    start?: number,
    end?: number
  ): Promise<Keyring> => {
    console.debug(`KeyringController - getKeyringForAccount: ${address}`);
    const keyrings = type
      ? this.keyrings.filter((keyring) => keyring.type === type)
      : this.keyrings;
    for (let i = 0; i < keyrings.length; i++) {
      const keyring = keyrings[i];
      const accounts = await keyring.getAccounts();
      if (accounts.includes(address)) {
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
  displayForKeyring = async (
    keyring: Keyring,
    index: number
  ): Promise<DisplayedKeyring> => {
    const accounts = await keyring.getAccounts();
    const all_accounts: { pubkey: string; alianName: string }[] = [];
    for (let i = 0; i < accounts.length; i++) {
      const pubkey = accounts[i];
      all_accounts.push({
        pubkey,
        alianName: keyring.type,
      });
    }
    return {
      type: keyring.type,
      accounts: all_accounts,
      keyring: new DisplayKeyring(keyring),
      index,
    };
  };

  getAllDisplayedKeyrings = async (
    resetCache?: boolean
  ): Promise<DisplayedKeyring[]> => {
    if (resetCache || !this.cachedDisplayedKeyring) {
      this.cachedDisplayedKeyring = await Promise.all(
        this.keyrings.map((keyring, index) =>
          this.displayForKeyring(keyring, index)
        )
      );
    }
    return this.cachedDisplayedKeyring;
  };

  getAllVisibleAccountsArray = async () => {
    const typedAccounts = await this.getAllDisplayedKeyrings();
    const result: { pubkey: string; type: string }[] = [];
    typedAccounts.forEach((accountGroup) => {
      result.push(
        ...accountGroup.accounts.map((account) => ({
          pubkey: account.pubkey,
          type: accountGroup.type,
        }))
      );
    });

    return result;
  };

  getAllPubkeys = async () => {
    const keyrings = await this.getAllDisplayedKeyrings();
    const result: { pubkey: string; type: string }[] = [];
    keyrings.forEach((accountGroup) => {
      result.push(
        ...accountGroup.accounts.map((account) => ({
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
  clearKeyrings = async (): Promise<void> => {
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
  _updateMemStoreKeyrings = async (): Promise<void> => {
    const keyrings = await Promise.all(
      this.keyrings.map((keyring, index) =>
        this.displayForKeyring(keyring, index)
      )
    );
    this.emit('updateKeyrings');
    return this.memStore.updateState({ keyrings });
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
}

export default new KeyringService();
