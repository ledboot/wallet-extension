import {
  AUTO_LOCK_TIMES,
  BRAND_ALIAN_TYPE_TEXT,
  DEFAULT_LOCKTIME_ID,
  EVENTS,
  KEYRING_TYPE,
  KEYRING_TYPES,
} from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import { Account, NetworkType, WalletKeyring } from '@/shared/types';

import keyringService from '../service/keyring';
import { DisplayedKeyring } from '../service/keyring/index';
import preferenceService from '../service/preference';
import sessionService from '../service/session';

export class WalletController {
  timer: any = null;

  /**
   * 启动钱包
   * @param password 密码
   */
  boot = (password: string) => keyringService.boot(password);

  /**
   * 检查钱包是否已启动
   */
  isBooted = () => keyringService.isBooted();

  /**
   * 检查是否有保险库
   */
  hasVault = () => keyringService.hasVault();

  /**
   * 验证密码
   * @param password 密码
   */
  verifyPassword = (password: string) =>
    keyringService.verifyPassword(password);

  /**
   * 修改密码
   * @param password 旧密码
   * @param newPassword 新密码
   */
  changePassword = (password: string, newPassword: string) =>
    keyringService.changePassword(password, newPassword);

  /**
   * 解锁钱包
   * @param password 密码
   */
  unlock = async (password: string) => {
    await keyringService.submitPassword(password);
    sessionService.broadcastEvent('unlock');
    this._resetTimeout();
  };

  /**
   * 检查钱包是否已解锁
   */
  async isUnlocked(): Promise<boolean> {
    return keyringService.memStore.getState().isUnlocked;
  }

  /**
   * 锁定钱包
   */
  async lockWallet(): Promise<void> {
    await keyringService.setLocked();
  }

  /**
   * 设置弹窗状态
   * @param isOpen 是否打开
   */
  setPopupOpen = (isOpen: boolean) => {
    preferenceService.setPopupOpen(isOpen);
  };

  /**
   * 检查钱包是否准备就绪
   */
  isReady = () => {
    // TODO: 可做一些依赖检查
    return true;
  };

  /**
   * 获取是否首次打开
   */
  getIsFirstOpen = () => {
    return preferenceService.getIsFirstOpen();
  };

  /**
   * 更新首次打开状态
   */
  updateIsFirstOpen = () => {
    return preferenceService.updateIsFirstOpen();
  };

  /**
   * 使用私钥创建临时密钥环
   * @param privateKey 私钥
   */
  createTmpKeyringWithPrivateKey = async (privateKey: string) => {
    const originKeyring = keyringService.createTmpKeyring('Simple Key Pair', [
      privateKey,
    ]);
    const displayedKeyring = await keyringService.displayForKeyring(
      originKeyring,
      -1
    );
    return this.displayedKeyringToWalletKeyring(displayedKeyring, -1, false);
  };

  /**
   * 移除密钥环
   * @param keyring 密钥环
   */
  removeKeyring = async (keyring: WalletKeyring) => {
    await keyringService.removeKeyring(keyring.index);
    const keyrings = await this.getKeyrings();
    const nextKeyring = keyrings[keyrings.length - 1];
    if (nextKeyring && nextKeyring.accounts[0]) {
      this.changeKeyring(nextKeyring);
      return nextKeyring;
    }
  };

  getKeyrings = async (): Promise<WalletKeyring[]> => {
    const displayedKeyrings = await keyringService.getAllDisplayedKeyrings();
    const keyrings: WalletKeyring[] = [];
    for (let index = 0; index < displayedKeyrings.length; index++) {
      const displayedKeyring = displayedKeyrings[index];
      if (displayedKeyring.type !== KEYRING_TYPE.Empty) {
        const keyring = this.displayedKeyringToWalletKeyring(
          displayedKeyring,
          displayedKeyring.index
        );
        keyrings.push(keyring);
      }
    }

    return keyrings;
  };

  /**
   * 获取当前账户
   */
  getCurrentAccount = async () => {
    const currentKeyring = await this.getCurrentKeyring();
    if (!currentKeyring) return null;
    const account = preferenceService.getCurrentAccount();
    let currentAccount: Account | undefined = undefined;
    currentKeyring.accounts.forEach((v) => {
      if (v.pubkey === account?.pubkey) {
        currentAccount = v;
      }
    });
    if (!currentAccount) {
      currentAccount = currentKeyring.accounts[0];
    }
    if (currentAccount) {
      currentAccount.flag = preferenceService.getAddressFlag(
        currentAccount.address
      );
      //   openapiService.setClientAddress(currentAccount.address, currentAccount.flag);
    }

    return currentAccount;
  };

  displayedKeyringToWalletKeyring = (
    displayedKeyring: DisplayedKeyring,
    index: number,
    initName = true
  ) => {
    const key = 'keyring_' + index;
    const type = displayedKeyring.type;
    const accounts: Account[] = [];
    for (let j = 0; j < displayedKeyring.accounts.length; j++) {
      const { pubkey } = displayedKeyring.accounts[j];
      //   const address = publicKeyToAddress(pubkey, networkType);
      const accountKey = key + '#' + j;
      const defaultName = this._generateAlianName(type, j + 1);
      const alianName = preferenceService.getAccountAlianName(
        accountKey,
        defaultName
      );
      const flag = preferenceService.getAddressFlag(pubkey);
      accounts.push({
        type,
        pubkey,
        address: pubkey,
        alianName,
        index: j,
        key: accountKey,
        flag,
      });
    }
    const alianName = preferenceService.getKeyringAlianName(
      key,
      initName ? `${KEYRING_TYPES[type].alianName} #${index + 1}` : ''
    );
    const keyring: WalletKeyring = {
      index,
      key,
      type,
      accounts,
      alianName,
    };
    return keyring;
  };

  private _generateAlianName = (type: string, index: number) => {
    return `${BRAND_ALIAN_TYPE_TEXT[type]} ${index}`;
  };

  getAccounts = async () => {
    const keyrings = await this.getKeyrings();
    return keyrings.reduce<Account[]>((pre, cur) => pre.concat(cur.accounts), []);
  };

  /**
   * 获取网络类型
   */
  getNetworkType = () => {
    return preferenceService.getNetworkType();
  };

  setNetworkType = async (networkType: NetworkType) => {
    if (networkType === this.getNetworkType()) return;
    await preferenceService.setNetworkType(networkType);
    sessionService.broadcastEvent('networkChanged', [networkType]);
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'networkChanged',
      params: networkType,
    });
  };

  /**
   * 获取当前密钥环
   */
  getCurrentKeyring = async () => {
    let currentKeyringIndex = preferenceService.getCurrentKeyringIndex();
    const displayedKeyrings = await keyringService.getAllDisplayedKeyrings();
    if (currentKeyringIndex === undefined) {
      const currentAccount = preferenceService.getCurrentAccount();
      for (let i = 0; i < displayedKeyrings.length; i++) {
        if (displayedKeyrings[i].type !== currentAccount?.type) {
          continue;
        }
        const found = displayedKeyrings[i].accounts.find(
          (v) => v.pubkey === currentAccount?.pubkey
        );
        if (found) {
          currentKeyringIndex = i;
          break;
        }
      }
      if (currentKeyringIndex === undefined) {
        currentKeyringIndex = 0;
      }
    }

    if (
      !displayedKeyrings[currentKeyringIndex] ||
      displayedKeyrings[currentKeyringIndex].type === KEYRING_TYPE.Empty ||
      !displayedKeyrings[currentKeyringIndex].accounts[0]
    ) {
      for (let i = 0; i < displayedKeyrings.length; i++) {
        if (displayedKeyrings[i].type !== KEYRING_TYPE.Empty) {
          currentKeyringIndex = i;
          preferenceService.setCurrentKeyringIndex(currentKeyringIndex);
          break;
        }
      }
    }
    const displayedKeyring = displayedKeyrings[currentKeyringIndex];
    if (!displayedKeyring) return null;
    return this.displayedKeyringToWalletKeyring(
      displayedKeyring,
      currentKeyringIndex
    );
  };

  /**
   * 切换密钥环
   * @param keyring 密钥环
   * @param accountIndex 账户索引
   */
  changeKeyring = async (keyring: WalletKeyring, accountIndex = 0) => {
    preferenceService.setCurrentKeyringIndex(keyring.index);
    preferenceService.setCurrentAccount(keyring.accounts[accountIndex]);
  };

  _resetTimeout = async () => {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    const timeId = preferenceService.getAutoLockTimeId();
    const timeConfig =
      AUTO_LOCK_TIMES[timeId] || AUTO_LOCK_TIMES[DEFAULT_LOCKTIME_ID];
    this.timer = setTimeout(() => {
      this.lockWallet();
    }, timeConfig.time);
  };

  createKeyringWithPrivateKey = async (
    privateKey: string,
    _alianName?: string
  ) => {
    void _alianName;
    const originKeyring = await keyringService.importPrivateKey(privateKey);

    const displayedKeyring = await keyringService.displayForKeyring(
      originKeyring,
      keyringService.keyrings.length - 1
    );

    const keyring = this.displayedKeyringToWalletKeyring(
      displayedKeyring,
      keyringService.keyrings.length - 1
    );

    this.changeKeyring(keyring);
  };
}

const walletControllerInstance = new WalletController();

// bridge KeyringService internal events to UI event bus
keyringService.on('updateKeyrings', () => {
  eventBus.emit(EVENTS.broadcastToUI, { method: 'updateKeyrings', params: {} });
});

export default walletControllerInstance;
