import {
  AUTO_LOCK_TIMES,
  DEFAULT_LOCKTIME_ID,
  EVENTS,
  KEYRING_TYPE,
  KEYRING_TYPES,
  ChainType,
  CHAIN_INFO,
} from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import { Account, WalletKeyring, ChainInfo } from '@/shared/types';

import keyringService from '../service/keyring';
import { DisplayedKeyring } from '../service/keyring/index';
import preferenceService from '../service/preference';
import { openapiService } from '../service';
import { decodeWalletImportFormat } from '@/background/service/keyring/simpleKeyring';
import AssetsList from '@/background/service/assetslist';
import type { Utxo, UtxoAddressSumInfo, CoinNames, transferAddressHistory } from '@/shared/types';

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
    
    // 钱包解锁后立即获取区块链网络
    try {
      const blockchains = await openapiService.fetchBlockchains();
      console.log('---------blockchains', blockchains);
    } catch (error) {
      console.error('Failed to fetch blockchains on unlock:', error);
    }
    
    eventBus.emit(EVENTS.broadcastToUI, { method: 'unlock', params: {} });
  };
  // UtxoCoin = () =>keyringService.UtxoCoin();

  /**
   * 初始化更新：获取账户最新UTXO并聚合写入loadStore
   */
  updateInit = async (start: number, limit: number): Promise<{ sums: UtxoAddressSumInfo[]; CoinNames: CoinNames[]; utxoItems: Utxo[] }> => {
    // 获取远程网络并自动添加到动态网络管理器
    // const blockchains = await openapiService.fetchBlockchains();
    // console.log('---------blockchains', blockchains);
    
    // // 获取所有可用网络（静态 + 动态）
    // const allNetworks = dynamicNetworkManager.getAllNetworks();
    // console.log('---------all available networks:', Object.keys(allNetworks));
    
    // // 获取动态网络统计
    // const dynamicNetworks = dynamicNetworkManager.getDynamicNetworks();
    // console.log('---------dynamic networks count:', dynamicNetworks.length);
    
    console.log('updateInit', start, limit);
    this.resetLockTime();
    const account = await this.getCurrentAccount();
    console.log('account', account);
    if (!account) return { sums: [], CoinNames: [], utxoItems: []};

    const utxoItems = await openapiService.update(account, start, limit);

    // Save UTXOs to preference store with block height check
    if (utxoItems.length > 0) {
      const existingUtxos = keyringService.getUtxos().filter(utxo => utxo.address === account.address);
      // const existingUtxos = preferenceService.getUtxos();
      const shouldUpdate = existingUtxos.length === 0 ||
                         utxoItems[0].blockHeight >= existingUtxos[0].blockHeight;
      
      if (shouldUpdate) {
        keyringService.updateUtxos(utxoItems);
        const currentChainInfo = this.getCurrentChainInfo();
        keyringService.addUtxosMap(account.address, currentChainInfo.chainId, utxoItems);
        const utxoMap = keyringService.getUtxosMap(account.address, currentChainInfo.chainId);
        console.log('---utxoMap',utxoMap)
        console.log('UTXOs saved to preference store');
      } else {
        console.log('Skipping UTXO update: New UTXOs are from an older block');
      }
    }

    const currentChainInfo = this.getCurrentChainInfo();
    const chainId = currentChainInfo.chainId;
    const chainIdStr = chainId.toString();
    let CoinNames: CoinNames[] = [];
    if (utxoItems.length > 0) {
      const { CoinNames: fetchedConames } = await openapiService.fetchTokentype(utxoItems, chainIdStr);
      console.log('wallet CoinNames:', fetchedConames);
      CoinNames = fetchedConames;
      console.log('update utxo', utxoItems);
    }
    const sums = await AssetsList.aggregate(account.address);

    // const assetsLists = await AssetsList.assetsLists();
    // console.log('assetsLists', assetsLists);
    
    console.log('sums', sums);
    return { sums, CoinNames, utxoItems };
  };

  assetsListsPage = async () => {
    const assetsLists = await AssetsList.assetsLists();
    console.log('assetsLists', assetsLists);
    const account = await this.getCurrentAccount();
    // 过滤出当前账户的资产
    const filteredAssets = assetsLists.assets.filter(asset => 
        asset.address === account?.address
    );
    
    // 使用辅助函数获取当前网络配置
    const currentChainInfo = this.getCurrentChainInfo();
    const chainName = currentChainInfo.iconLabel;
    
    return {assetsData: filteredAssets, chainName};
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

  getWIF = (address: string) => {
    return keyringService.exportAccount(address);
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
    
    preferenceService.setNetworkType(chainInfo.networkType)
    preferenceService.setChainType(chainType)
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

  // createKeyringWithPrivateKey = async (
  //   wif: string,
  //   _alianName?: string
  // ) => {
  //   void _alianName;
  //   const originKeyring = await keyringService.importPrivateKey(privateKey);

  //   const displayedKeyring = await keyringService.displayForKeyring(
  //     originKeyring,
  //     keyringService.keyrings.length - 1
  //   );

  //   const keyring = this.displayedKeyringToWalletKeyring(
  //     displayedKeyring,
  //     keyringService.keyrings.length - 1
  //   );

  //   this.changeKeyring(keyring.key,0);
  //   // 活动发生，刷新心跳时间
  //   this._touchHeartbeat();
  //   eventBus.emit(EVENTS.broadcastToUI, {
  //     method: 'updateKeyrings',
  //     params: {}
  //   });
  // };

  importPrivateKey = async (wif: string) => {
    const { privateKeyHex, compressed } = decodeWalletImportFormat(wif);
    const originKeyring = await keyringService.importPrivateKey(privateKeyHex, compressed);

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
  
  generatePrePrivateKey = async (keyringType: string) =>{
    const keyring = await keyringService.createTmpKeyring(
      keyringType,
      []
    );
    return keyring.generatePrePrivateKey();
  }

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

  getTransferAddressHistory = async () : Promise<transferAddressHistory[]>=> {
    const addresses = keyringService.getTransferAddressHistory();
    return addresses;
  }
  
  updateTransferAddressesHistory = async (newAddress: string) => {
    const addresses = newAddress.includes(',') 
      ? newAddress.split(',').map(addr => addr.trim()).filter(addr => addr.length > 0)
      : [newAddress];
    const historyList: transferAddressHistory[] = addresses.map(address => ({
      address,
      updated: Date.now()
    }));
    keyringService.updateTransferAddressesHistory(historyList);
  }

  getTransferFees = async (tokenType: number, senderAddress: string, isAll: boolean, amount?: string, receivedAddress?: string) => {
    let fees = 0;
    if (isAll) {
      fees = await openapiService.computeTransactioFeesMax(tokenType, senderAddress);
    } else {
      fees = await openapiService.computeTransactioFees(tokenType, senderAddress, Number(amount), receivedAddress || '');
    }
    return fees;
  }
  /**
   * 获取存储的网络配置
   */
  getStoredChainInfo = async (): Promise<{ [key: string]: ChainInfo }> => {
    return preferenceService.getAllchainInfo();
  };

  transfer = async ( amount: string, tokenType: string, receivedAddress: string, password: string, senderAddress: string, crosschain: number, timeLimit: number) => {
    const res = await openapiService.transfer(BigInt(Number(amount) * 1e8), BigInt(Number(tokenType)), receivedAddress, password, senderAddress, crosschain, timeLimit)
    let result = null;
    if (res && res.result) {
      result = res.result;
      // 转账成功后发送刷新事件
      eventBus.emit(EVENTS.broadcastToUI, {
        method: 'refreshAssets',
        params: null
      });
    }
    console.log('transfer res:', res);
    return result;
  }
}


export default new WalletController();
