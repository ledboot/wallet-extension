import {
  AUTO_LOCK_TIMES,
  DEFAULT_LOCKTIME_ID,
  EVENTS,
  KEYRING_TYPE,
  KEYRING_TYPES,
  ChainType,
  CHAIN_INFO
} from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import { Account, WalletKeyring } from '@/shared/types';
import { NetworkType } from '@/shared/constants';

import keyringService from '../service/keyring';
import { DisplayedKeyring } from '../service/keyring/index';
import preferenceService from '../service/preference';
import sessionService from '../service/session';
import { openapiService } from '../service';

export class WalletController {
  timer: any = null;
  private lastHeartbeatTs: number | null = null;
  private heartbeatInterval: any = null;

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
    // 心跳模式：初始化心跳时间并启动监控
    this._initHeartbeat();
    // 更新当前keyring和account
    if (!preferenceService.getCurrentKeyringKey()){
      const displayedKeyring = await keyringService.getAllDisplayedKeyrings();
      if (displayedKeyring.length > 0) {
        preferenceService.setCurrentKeyringKey(displayedKeyring[0].key);
        preferenceService.setCurrentAccountIndex(0);
      }
    }
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
    // 上锁后停止心跳监控
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
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
    const originKeyring = keyringService.createTmpKeyring(KEYRING_TYPE.SimpleKeyring, [
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
  removeKeyring = async (keyringKey: string) => {
    await keyringService.removeKeyring(keyringKey);
    const keyrings = await this.getKeyrings();
    const nextKeyring = keyrings[keyrings.length - 1];
    if (nextKeyring) {
      this.changeKeyring(nextKeyring.key,0);
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
    const account = currentKeyring.accounts[preferenceService.getCurrentAccountIndex()];
    return account;
  };

  displayedKeyringToWalletKeyring = (
    displayedKeyring: DisplayedKeyring,
    index: number,
    initName = true
  ) => {
    const type = displayedKeyring.type;
    
    // 账户 alianName 从 PreferenceService 获取，如果没有则使用来自 SimpleKeyring 的默认值
    const accounts = displayedKeyring.accounts.map((account, j) => {
      const accountKey = displayedKeyring.key + '#' + j;
      const alianName = preferenceService.getAccountAlianName(
        accountKey,
        account.alianName // 使用来自 SimpleKeyring 的默认值
      );
      
      return {
        type,
        pubkey: account.pubkey,
        address: account.pubkey,
        addressHex: account.addressHex,
        alianName,
        index: j,
        key: accountKey,
        flag: preferenceService.getAddressFlag(account.pubkey),
      };
    });

    // 钱包 alianName 从 PreferenceService 获取
    const alianName = preferenceService.getKeyringAlianName(
      displayedKeyring.key,
      initName ? `${KEYRING_TYPES[type].alianName} #${index + 1}` : ''
    );
    
    return {
      index,
      key: displayedKeyring.key,
      type,
      accounts,
      alianName,
    };
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

  changeNetwork = async (chainType: ChainType) => {
    const chainInfo = CHAIN_INFO[chainType]
    preferenceService.setNetworkType(chainInfo.networkType)
    await this.setNetworkType(CHAIN_INFO[chainType].networkType);
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
    this.resetLockTime();
    const currentKeyringKey = preferenceService.getCurrentKeyringKey();
    if (!currentKeyringKey){
      return null
    }
    const displayedKeyring = await keyringService.getDisplayedKeyringByKey(currentKeyringKey);
    if (!displayedKeyring) {
      return null;
    }
    return this.displayedKeyringToWalletKeyring(displayedKeyring, displayedKeyring.index);
  };

  /**
   * 切换密钥环
   * @param keyring 密钥环
   * @param accountIndex 账户索引
   */
  changeKeyring = async (keyringKey: string,accountIndex = 0) => {
    await keyringService.changeKeyring(keyringKey);
    preferenceService.setCurrentKeyringKey(keyringKey);
    preferenceService.setCurrentAccountIndex(accountIndex);
    this.resetLockTime();
    // 发送更新事件
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'updateKeyrings',
      params: {}
    });
  };


  /** UI 心跳：更新心跳时间 */
  heartbeat = () => {
    this._touchHeartbeat();
    return { ok: true };
  };

  private _touchHeartbeat() {
    this.lastHeartbeatTs = Date.now();
  }

  private resetLockTime() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    const timeId = preferenceService.getAutoLockTimeId();
    const timeConfig =
      AUTO_LOCK_TIMES[timeId] || AUTO_LOCK_TIMES[DEFAULT_LOCKTIME_ID];

    this.timer = setTimeout(() => {
      const isUnlocked = keyringService.memStore.getState().isUnlocked;
      if (isUnlocked) {
        this.lockWallet();
      }
    }, timeConfig.time);
  }

  private _initHeartbeat() {
    this._touchHeartbeat();

    // 清理之前的定时器
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // 启动心跳监控（每秒检查一次）
    this.heartbeatInterval = setInterval(() => {
      const isUnlocked = keyringService.memStore.getState().isUnlocked;
      if (!isUnlocked) {
        return;
      }

      const timeId = preferenceService.getAutoLockTimeId();
      const timeConfig =
        AUTO_LOCK_TIMES[timeId] || AUTO_LOCK_TIMES[DEFAULT_LOCKTIME_ID];

      const now = Date.now();
      // 修复：如果 lastHeartbeatTs 为 null，使用当前时间
      const last = this.lastHeartbeatTs || now;
      const elapsed = now - last;

      if (elapsed > timeConfig.time) {
        this.lockWallet();
      }
    }, 1000);

    this.resetLockTime();

  }

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

    this.changeKeyring(keyring.key,0);
    // 活动发生，刷新心跳时间
    this._touchHeartbeat();
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'updateKeyrings',
      params: {}
    });
  };
  
  generatePrePrivateKey = (keyringType: string) =>{
    const keyring = keyringService.createTmpKeyring(
      keyringType,
      []
    );
    const { address: preAddress, wif: preWIF } = keyring.generatePrePrivateKey();
    return { address: preAddress, wif: preWIF };
  }
  

  getAddressHistory = async (params: { account: Account; start: number; limit: number }) => {
    this.resetLockTime();
    return await openapiService.getAddressHistory(params);
  };

  /**
   * 更新账户别名
   * @param accountKey 账户键值
   * @param newName 新名称
   */
  updateAccountAlianName = async (accountKey: string, newName: string) => {
    preferenceService.setAccountAlianName(accountKey, newName);
    // 触发 UI 更新
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'updateKeyrings',
      params: {}
    });
  };

  /**
   * 更新钱包别名
   * @param keyringKey 钱包键值
   * @param newName 新名称
   */
  updateKeyringAlianName = async (keyringKey: string, newName: string) => {
    preferenceService.setKeyringAlianName(keyringKey, newName);
    // 触发 UI 更新
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'updateKeyrings',
      params: {}
    });
  };
}


const walletControllerInstance = new WalletController();

// bridge KeyringService internal events to UI event bus
keyringService.on('updateKeyrings', () => {
  eventBus.emit(EVENTS.broadcastToUI, { method: 'updateKeyrings', params: {} });
});

export default walletControllerInstance;
