import { PropsWithChildren, useEffect } from 'react';

import { CHAIN_INFO, ChainType, EVENTS, NetworkType } from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import { Message } from '@/shared/utils';
import { useNavigate } from '@/ui/pages/MainRoute';
import { accountsStore } from '@/ui/state/accounts';
import { globalStore } from '@/ui/state/global';
import { keyringsStore } from '@/ui/state/keyrings';
import { settingsStore } from '@/ui/state/settings';
import { useWallet } from '@/ui/utils';

const { PortMessage } = Message;

export default function SyncBridge(props: PropsWithChildren) {
  const navigate = useNavigate();
  const wallet = useWallet();

  useEffect(() => {
    // ── PortMessage 连接 ─────────────────────────────────────────
    const portMessageChannel = new PortMessage();
    portMessageChannel.connect('popup');

    const broadcastHandler = (data: any) => {
      if (data?.type === 'broadcast') {
        eventBus.emit(EVENTS.broadcastToUI, {
          method: data.method,
          params: data.params,
        });
      }
    };
    portMessageChannel.listen(broadcastHandler);

    // 定时心跳（维持 popup 与 background 的连接）
    const heartbeatInterval = setInterval(() => {
      try {
        portMessageChannel.request({
          type: 'controller',
          method: 'heartbeat',
          args: [],
        });
      } catch {
        // ignore
      }
    }, 15_000);

    // ── 辅助函数（定义在 useEffect 内部，捕获最新的 wallet 引用）──

    /**
     * 同步资产到 keyringsStore。
     * background 广播 refreshAssets 时调用，或初始化时主动调用。
     */
    const refreshAssets = async () => {
      const before = keyringsStore.getState();
      const activeKey = `${before.currentAddress}:${before.currentChainId}`;
      const hasCachedActiveAssets =
        !!before.currentAddress && Object.prototype.hasOwnProperty.call(before.assetsMap, activeKey);

      // 仅首次进入（当前没有缓存资产）显示 loading，后续刷新不切换 loading，避免列表闪动
      if (!hasCachedActiveAssets) {
        keyringsStore.getState().setAssetsLoading(true);
      }

      try {
        const { assetsData, chainName, address, chainId } = await wallet.assetsListsPage();
        console.log('refreshAssets', assetsData, chainName, address, chainId);
        if (address) {
          keyringsStore.getState().setCurrentAssets(address, chainId, assetsData, chainName);
        }
      } catch (e) {
        console.error('Failed to refresh assets:', e);
        if (!hasCachedActiveAssets) {
          keyringsStore.getState().setAssetsLoading(false);
        }
      }
    };

    /**
     * 同步 keyrings / currentKeyring / currentAccount 到 keyringsStore & accountsStore。
     * background 广播 updateKeyrings 时调用，或初始化时主动调用。
     */
    const syncKeyrings = async () => {
      const keyrings = await wallet.getKeyrings();
      if (keyrings && keyrings.length > 0) {
        keyringsStore.getState().setKeyrings(keyrings);

        const currentKeyring = await wallet.getCurrentKeyring();
        if (currentKeyring) {
          keyringsStore.getState().setCurrent(currentKeyring);
        }

        const currentAccount = await wallet.getCurrentAccount();
        if (currentAccount) {
          accountsStore.getState().setCurrent(currentAccount);
        }
      }
    };

    // ── 广播事件分发 ─────────────────────────────────────────────
    const onBroadcastToUI = async (payload: any) => {
      if (!payload?.method) return;
      const { method, params } = payload;
      console.log('received onBroadcastToUI', method, params);

      switch (method) {
        case 'lock': {
          globalStore.getState().update({ isUnlocked: false });
          keyringsStore.getState().clearAssets();
          navigate('UnlockScreen');
          break;
        }
        case 'unlock': {
          globalStore.getState().update({ isUnlocked: true });
          // 刚解锁：同步 keyrings + assets
          await syncKeyrings();
          await refreshAssets();
          break;
        }
        case 'initVault': {
          navigate('WelcomeScreen');
          break;
        }
        case 'updateKeyrings': {
          syncKeyrings();
          break;
        }
        case 'networkChanged': {
          if (params && typeof params === 'string') {
            const chainType = params as ChainType;
            let networkType: NetworkType;
            if (CHAIN_INFO[chainType]) {
              networkType = CHAIN_INFO[chainType].networkType;
            } else {
              const storedChainInfo = await wallet.getStoredChainInfo();
              const chainInfo = storedChainInfo[chainType];
              if (!chainInfo) {
                console.error('Network info not found for:', chainType);
                return;
              }
              networkType = chainInfo.networkType;
            }
            settingsStore.getState().updateSettings({ networkType, chainType });
            await syncKeyrings();
            await refreshAssets();
          }
          break;
        }
        case 'refreshAssets': {
          // background 轮询到区块变化后广播，更新 keyringsStore
          refreshAssets();
          break;
        }
        default: {
          eventBus.emit(`ui:${method}`, params);
          break;
        }
      }
    };
    eventBus.addEventListener(EVENTS.broadcastToUI, onBroadcastToUI);

    // ── 初始化同步 ───────────────────────────────────────────────
    // 解决 popup 重开时钱包已解锁但不触发任何事件，导致 UI state 为空的问题。
    // 策略：mount 后立即检查锁定状态，已解锁则主动拉取 background 当前数据。
    wallet.isUnlocked().then((unlocked) => {
      if (unlocked) {
        syncKeyrings();
        refreshAssets();
      }
    });

    return () => {
      portMessageChannel.dispose();
      eventBus.removeEventListener(EVENTS.broadcastToUI, onBroadcastToUI);
      clearInterval(heartbeatInterval);
    };
  }, [navigate, wallet]);

  return props.children as any;
}
