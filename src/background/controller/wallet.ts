import type { CoinNames, transferAddressHistory, Utxo, UtxoAddressSumInfo } from '@/shared/types';

import { decodeWalletImportFormat } from '@/background/service/keyring/simpleKeyring';
import {
  AUTO_LOCK_TIMES,
  CHAIN_INFO,
  ChainType,
  DEFAULT_LOCKTIME_ID,
  EVENTS,
  KEYRING_TYPE,
  KEYRING_TYPES,
} from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import { Account, ChainInfo, WalletKeyring } from '@/shared/types';

import { openapiService } from '../service';
import keyringService from '../service/keyring';
import { DisplayedKeyring } from '../service/keyring/index';
import preferenceService from '../service/preference';

export class WalletController {
  timer: any = null;
  private lastHeartbeatTs: number | null = null;
  private heartbeatInterval: any = null;
  private utxoPollingInterval: any = null;
  private isPollingUtxos: boolean = false;

  /**
   * 启动钱包
   * @param password 密码
   */
  boot = async (password: string) => {
    await keyringService.boot(password);

    // 心跳模式：初始化心跳时间并启动监控
    this._initHeartbeat();

    // 钱包启动后立即获取区块链网络
    try {
      await openapiService.fetchBlockchains();
    } catch (error) {
      console.error('Failed to fetch blockchains on boot:', error);
    }

    eventBus.emit(EVENTS.broadcastToUI, { method: 'unlock', params: {} });
    this._startUtxoPolling();
  };

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
  verifyPassword = (password: string) => keyringService.verifyPassword(password);

  /**
   * 修改密码
   * @param password 旧密码
   * @param newPassword 新密码
   */
  changePassword = (password: string, newPassword: string) => keyringService.changePassword(password, newPassword);

  /**
   * 解锁钱包
   * @param password 密码
   */
  unlock = async (password: string) => {
    await keyringService.submitPassword(password);
    // 心跳模式：初始化心跳时间并启动监控
    this._initHeartbeat();
    // 更新当前keyring和account
    if (!preferenceService.getCurrentKeyringKey()) {
      const displayedKeyring = await keyringService.getAllDisplayedKeyrings();
      if (displayedKeyring.length > 0) {
        preferenceService.setCurrentKeyringKey(displayedKeyring[0].key);
        preferenceService.setCurrentAccountIndex(0);
      }
    }

    // 钱包解锁后立即获取区块链网络
    try {
      await openapiService.fetchBlockchains();
    } catch (error) {
      console.error('Failed to fetch blockchains on unlock:', error);
    }

    eventBus.emit(EVENTS.broadcastToUI, { method: 'unlock', params: {} });
    this._startUtxoPolling();
  };

  /**
   * 同步当前账户的 UTXO：从链上拉取最新数据，写入 store，聚合余额，获取代币名称。
   * 由 background 定时轮询调用，UI 不应主动调用此方法。
   */
  syncAccountUtxos = async (start: number, limit: number, isBackgroundPolling = false) => {
    if (!isBackgroundPolling) this.resetLockTime();
    const account = await this.getCurrentAccount();
    console.log('syncAccountUtxos', account?.address, 'start:', start, 'limit:', limit);
    if (!account) return { sums: [], CoinNames: [], utxoItems: [] };

    const utxoItems = await openapiService.update(account, start, limit);

    // Save UTXOs to preference store with block height check
    if (utxoItems.length > 0) {
      const existingUtxos = keyringService.getUtxos().filter((utxo) => utxo.address === account.address);
      // const existingUtxos = preferenceService.getUtxos();
      const shouldUpdate = existingUtxos.length === 0 || utxoItems[0].blockHeight >= existingUtxos[0].blockHeight;

      console.log('shouldUpdate', shouldUpdate);
      if (shouldUpdate) {
        const changed = JSON.stringify(existingUtxos) !== JSON.stringify(utxoItems);

        keyringService.updateUtxos(utxoItems);
        const currentChainInfo = this.getCurrentChainInfo();
        keyringService.addUtxosMap(account.address, currentChainInfo.chainId, utxoItems);
        if (changed) {
          eventBus.emit(EVENTS.broadcastToUI, {
            method: 'refreshAssets',
            params: null,
          });
        }
      } else {
        console.log('Skipping UTXO update: New UTXOs are from an older block');
      }
    }
  };

  assetsListsPage = async () => {
    const account = await this.getCurrentAccount();
    const currentChainInfo = this.getCurrentChainInfo();
    const assetsData = keyringService.getAssetsPage(account?.address ?? '');
    return { assetsData, chainName: currentChainInfo.iconLabel };
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
    this._stopUtxoPolling();
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
   * 移除密钥环
   * @param keyring 密钥环
   */
  removeKeyring = async (keyringKey: string) => {
    await keyringService.removeKeyring(keyringKey);
    const keyrings = await this.getKeyrings();
    const nextKeyring = keyrings[keyrings.length - 1];
    if (nextKeyring) {
      await this.changeKeyring(nextKeyring.key);
    }
  };

  /**
   * 移除账户
   * @param address 账户地址
   * @param type 账户类型
   */
  removeAccount = async (address: string, type: string) => {
    await keyringService.removeAccount(address, type);
  };

  getKeyrings = async (): Promise<WalletKeyring[]> => {
    const displayedKeyrings = await keyringService.getAllDisplayedKeyrings();
    const keyrings: WalletKeyring[] = [];
    for (let index = 0; index < displayedKeyrings.length; index++) {
      const displayedKeyring = displayedKeyrings[index];
      if (displayedKeyring.type !== KEYRING_TYPE.Empty) {
        const keyring = this.displayedKeyringToWalletKeyring(displayedKeyring, displayedKeyring.index);
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

  getWIF = (address: string) => {
    return keyringService.exportAccount(address);
  };

  displayedKeyringToWalletKeyring = (displayedKeyring: DisplayedKeyring, index: number, initName = true) => {
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
   * 获取当前网络配置（支持动态网络）
   */
  private getCurrentChainInfo = (): ChainInfo => {
    const currentChainType = preferenceService.getChainType();

    // 优先从 CHAIN_INFO 获取，如果没有则从存储获取
    if (CHAIN_INFO[currentChainType]) {
      return CHAIN_INFO[currentChainType];
    } else {
      const storedChainInfo = preferenceService.getchainInfo(currentChainType);
      if (storedChainInfo) {
        return storedChainInfo;
      } else {
        throw new Error(`Chain info not found for: ${currentChainType}`);
      }
    }
  };

  /**
   * 获取网络类型
   */
  getNetworkType = () => {
    return preferenceService.getNetworkType();
  };

  changeNetwork = async (chainType: ChainType) => {
    // 优先从存储中获取网络配置，如果没有则从常量中获取
    let chainInfo = preferenceService.getchainInfo(chainType);
    if (!chainInfo) {
      chainInfo = CHAIN_INFO[chainType];
    }

    if (!chainInfo) {
      throw new Error(`Chain info not found for: ${chainType}`);
    }

    preferenceService.setNetworkType(chainInfo.networkType);
    preferenceService.setChainType(chainType);
    keyringService.changeNetwork();
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'networkChanged',
      params: chainType,
    });
  };

  /**
   * 获取当前密钥环
   */
  getCurrentKeyring = async () => {
    this.resetLockTime();
    const currentKeyringKey = preferenceService.getCurrentKeyringKey();
    if (!currentKeyringKey) {
      return null;
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
  changeKeyring = async (keyringKey: string, accountIndex = 0) => {
    await keyringService.changeKeyring(keyringKey);
    preferenceService.setCurrentKeyringKey(keyringKey);
    preferenceService.setCurrentAccountIndex(accountIndex);
    this.resetLockTime();
    // 发送更新事件
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'updateKeyrings',
      params: {},
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
    const timeConfig = AUTO_LOCK_TIMES[timeId] || AUTO_LOCK_TIMES[DEFAULT_LOCKTIME_ID];

    this.timer = setTimeout(() => {
      const isUnlocked = keyringService.memStore.getState().isUnlocked;
      if (isUnlocked) {
        this.lockWallet();
      }
    }, timeConfig.time);
  }

  private _startUtxoPolling() {
    if (this.utxoPollingInterval) {
      clearInterval(this.utxoPollingInterval);
    }
    this.utxoPollingInterval = setInterval(async () => {
      const isUnlocked = await this.isUnlocked();
      if (!isUnlocked || this.isPollingUtxos) return;

      this.isPollingUtxos = true;
      try {
        const account = await this.getCurrentAccount();
        if (!account) return;

        const sums = await this.getUtxoSum();
        const latest = (Array.isArray(sums) ? sums.find((s) => s.address === account.address)?.blockHeight : 0) || 0;

        await this.syncAccountUtxos(latest, 2048, true);
      } catch (e) {
        console.error('UTXO polling error:', e);
      } finally {
        this.isPollingUtxos = false;
      }
    }, 15000); // 15秒轮询
  }

  private _stopUtxoPolling() {
    if (this.utxoPollingInterval) {
      clearInterval(this.utxoPollingInterval);
      this.utxoPollingInterval = null;
    }
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
      const timeConfig = AUTO_LOCK_TIMES[timeId] || AUTO_LOCK_TIMES[DEFAULT_LOCKTIME_ID];

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

  importPrivateKey = async (wif: string) => {
    const { privateKeyHex, compressed } = decodeWalletImportFormat(wif);
    const originKeyring = await keyringService.importPrivateKey(privateKeyHex, compressed);

    const displayedKeyring = await keyringService.displayForKeyring(originKeyring, keyringService.keyrings.length - 1);

    const keyring = this.displayedKeyringToWalletKeyring(displayedKeyring, keyringService.keyrings.length - 1);

    this.changeKeyring(keyring.key, 0);
    // 活动发生，刷新心跳时间
    this._touchHeartbeat();
    eventBus.emit(EVENTS.broadcastToUI, {
      method: 'updateKeyrings',
      params: {},
    });
  };

  generatePrePrivateKey = async (keyringType: string) => {
    const keyring = await keyringService.createTmpKeyring(keyringType, []);
    return keyring.generatePrePrivateKey();
  };

  getAddressHistory = async (account: Account, start: number, limit: number) => {
    this.resetLockTime();
    const { txHistory } = await openapiService.getAddressHistory(account, start, limit);
    console.log('getAddressHistory', txHistory);
    return txHistory;
  };

  /**
   * 获取已聚合的 UTXO 汇总（用于确定最新的 blockHeight）
   */
  getUtxoSum = async (): Promise<UtxoAddressSumInfo[]> => {
    const state = (keyringService as any)?.store?.getState?.() || {};
    return state.utxoSum || [];
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
      params: {},
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
      params: {},
    });
  };

  getTransferAddressHistory = async (): Promise<transferAddressHistory[]> => {
    const addresses = keyringService.getTransferAddressHistory();
    return addresses;
  };

  updateTransferAddressesHistory = async (newAddress: string) => {
    const addresses = newAddress.includes(',')
      ? newAddress
          .split(',')
          .map((addr) => addr.trim())
          .filter((addr) => addr.length > 0)
      : [newAddress];
    const historyList: transferAddressHistory[] = addresses.map((address) => ({
      address,
      updated: Date.now(),
    }));
    keyringService.updateTransferAddressesHistory(historyList);
  };

  getTransferFees = async (
    tokenType: number,
    senderAddress: string,
    isAll: boolean,
    amount?: string,
    receivedAddress?: string
  ) => {
    let fees = 0;
    if (isAll) {
      fees = await openapiService.computeTransactioFeesMax(tokenType, senderAddress);
    } else {
      fees = await openapiService.computeTransactioFees(
        tokenType,
        senderAddress,
        Number(amount),
        receivedAddress || ''
      );
    }
    return fees;
  };
  /**
   * 获取存储的网络配置
   */
  getStoredChainInfo = async (): Promise<{ [key: string]: ChainInfo }> => {
    return preferenceService.getAllchainInfo();
  };

  /**
   * 添加自定义网络
   */
  addchainInfo = async (chainType: string, chainInfo: ChainInfo) => {
    preferenceService.addchainInfo(chainType, chainInfo);
  };

  transfer = async (
    amount: string,
    tokenType: string,
    receivedAddress: string,
    password: string,
    senderAddress: string,
    crosschain: number,
    timeLimit: number
  ) => {
    const res = await openapiService.transfer(
      BigInt(Number(amount) * 1e8),
      BigInt(Number(tokenType)),
      receivedAddress,
      password,
      senderAddress,
      crosschain,
      timeLimit
    );
    let result = null;
    if (res && res.result) {
      result = res.result;
      // 注意：不在此处广播 refreshAssets。
      // 转账广播成功只代表交易进入 mempool，链上 UTXO 尚未变化。
      // background 轮询到区块高度变化时会自动广播 refreshAssets，届时 UI 才真正刷新。
    }
    return result;
  };
}

export default new WalletController();
