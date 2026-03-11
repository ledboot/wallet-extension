// This script is injected into the webpage's context
import { EventEmitter } from 'eventemitter3';

import BroadcastChannelMessage from '@/shared/utils/message/broadcastChannelMessage';

import PushEventHandlers from './pushEventHandlers';
import ReadyPromise from './readyPromise';
import { $, domReadyCall } from './utils';

const log = (event: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    // console.log(`%c [zent] ${event}`, 'font-weight:600;background:#7d6ef9;color:#fff;', ...args)
  }
};

// Must match CHANNEL_NAME in content_scripts/index.ts (bridge script)
const CHANNEL_NAME = 'ZENT_CHANNEL';

interface StateProvider {
  accounts: string[] | null;
  isConnected: boolean;
  isUnlocked: boolean;
  initialized: boolean;
}

// Symbol for truly private request method
const requestMethodKey = Symbol('requestMethod');

const _zentProviderPrivate: {
  _selectedAddress: string | null;
  _networkId: string | null;
  _isConnected: boolean;
  _initialized: boolean;
  _isUnlocked: boolean;
  _state: StateProvider;
  _pushEventHandlers: PushEventHandlers | null;
  _requestPromise: ReadyPromise;
  _bcm: BroadcastChannelMessage;
} = {
  _selectedAddress: null,
  _networkId: null,
  _isConnected: false,
  _initialized: false,
  _isUnlocked: false,
  _state: {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
  },
  _pushEventHandlers: null,
  _requestPromise: new ReadyPromise(0),
  _bcm: new BroadcastChannelMessage(CHANNEL_NAME),
};

let cacheOrigin = '';

export class ZentProvider extends EventEmitter {
  constructor() {
    super();
    this.initialize();
    _zentProviderPrivate._pushEventHandlers = new PushEventHandlers(
      this,
      _zentProviderPrivate
    );
  }

  private tryDetectTab = async () => {
    const origin = window.top?.location.origin;
    if (origin && cacheOrigin !== origin) {
      cacheOrigin = origin;
      const icon =
        ($('head > link[rel~="icon"]') as HTMLLinkElement)?.href ||
        ($('head > meta[itemprop="image"]') as HTMLMetaElement)?.content;

      const name =
        document.title ||
        ($('head > meta[name="title"]') as HTMLMetaElement)?.content ||
        origin;

      _zentProviderPrivate._bcm.request({
        method: 'tabCheckin',
        params: { icon, name },
      });
    }
  };

  initialize = async () => {
    document.addEventListener(
      'visibilitychange',
      this._requestPromiseCheckVisibility
    );

    _zentProviderPrivate._bcm
      .connect()
      .on('message', this._handleBackgroundMessage);

    this.tryDetectTab();
    domReadyCall(() => {
      this.tryDetectTab();
    });

    try {
      // Fetch initial provider state from background
      const result: any = await this[requestMethodKey]({
        method: 'getProviderState',
      });
      if (result?.isUnlocked) {
        _zentProviderPrivate._isUnlocked = true;
        _zentProviderPrivate._state.isUnlocked = true;
      }
      this.emit('connect', {});
      if (result?.networkId) {
        _zentProviderPrivate._pushEventHandlers?.networkChanged({
          networkId: result.networkId,
        });
      }
      if (result?.accounts) {
        _zentProviderPrivate._pushEventHandlers?.accountsChanged(
          result.accounts
        );
      }
    } catch {
      // Ignore initialization errors — background may not be ready yet
    } finally {
      _zentProviderPrivate._initialized = true;
      _zentProviderPrivate._state.initialized = true;
      this.emit('_initialized');
    }

    this.keepAlive();
  };

  /**
   * Periodically ping background to keep the service worker alive.
   */
  private keepAlive = () => {
    this[requestMethodKey]({ method: 'keepAlive', params: {} })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        setTimeout(() => {
          this.keepAlive();
        }, 10_000);
      });
  };

  private _requestPromiseCheckVisibility = () => {
    if (document.visibilityState === 'visible') {
      _zentProviderPrivate._requestPromise.check(1);
    } else {
      _zentProviderPrivate._requestPromise.uncheck(1);
    }
  };

  private _handleBackgroundMessage = ({
    event,
    data,
  }: {
    event: string;
    data: unknown;
  }) => {
    log('[push event]', event, data);
    if (
      _zentProviderPrivate._pushEventHandlers?.[
        event as keyof PushEventHandlers
      ]
    ) {
      return (
        _zentProviderPrivate._pushEventHandlers[
          event as keyof PushEventHandlers
        ] as Function
      )(data);
    }

    this.emit(event, data);
  };

  // Truly private via Symbol — external code cannot call this
  private [requestMethodKey] = async (data: {
    method: string;
    params?: unknown;
  }) => {
    if (!data) {
      throw new Error('Invalid request');
    }

    this._requestPromiseCheckVisibility();

    return _zentProviderPrivate._requestPromise.call(() => {
      log('[request]', JSON.stringify(data, null, 2));
      return _zentProviderPrivate._bcm
        .request(data)
        .then((res) => {
          log('[request: success]', data.method, res);
          return res;
        })
        .catch((err) => {
          log('[request: error]', data.method, err);
          throw err;
        });
    });
  };

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Request the user to connect their wallet.
   * Opens the extension popup and returns the list of connected accounts.
   */
  requestAccounts = async (): Promise<string[]> => {
    return this[requestMethodKey]({ method: 'requestAccounts' }) as Promise<
      string[]
    >;
  };

  /** Disconnect the wallet from the current site. */
  disconnect = async () => {
    return this[requestMethodKey]({ method: 'disconnect' });
  };

  /**
   * Get the list of accounts that are accessible to this page.
   */
  getAccounts = async (): Promise<string[]> => {
    return this[requestMethodKey]({ method: 'getAccounts' }) as Promise<
      string[]
    >;
  };

  /** Get the currently selected/active account. */
  getCurrentAccount = async () => {
    return this[requestMethodKey]({ method: 'getCurrentAccount' });
  };

  /** Get the currently active network information. */
  getNetwork = async () => {
    return this[requestMethodKey]({ method: 'getNetwork' });
  };

  /** Get all available networks. */
  getNetworks = async () => {
    return this[requestMethodKey]({ method: 'getNetworks' });
  };

  /**
   * Switch to a different network.
   * @param chainId - The chain ID of the target network
   */
  switchNetwork = async (chainId: number) => {
    return this[requestMethodKey]({
      method: 'switchNetwork',
      params: { chainId },
    });
  };

  /**
   * Get the balance for a given address.
   * @param address - The address to query
   * @param chainId - The chain ID (optional)
   */
  getBalance = async (address: string, chainId?: number) => {
    return this[requestMethodKey]({
      method: 'getBalance',
      params: { address, chainId },
    });
  };

  /**
   * Get UTXOs for the given address.
   * @param address - The address to query
   */
  getUtxos = async (address: string) => {
    return this[requestMethodKey]({
      method: 'getUtxos',
      params: { address },
    });
  };

  /**
   * Sign a raw transaction.
   * @param tx - The raw transaction bytes/hex
   */
  signTransaction = async (tx: string) => {
    return this[requestMethodKey]({
      method: 'signTransaction',
      params: { tx },
    });
  };

  /**
   * Broadcast a signed raw transaction.
   * @param tx - The signed raw transaction bytes/hex
   */
  sendTransaction = async (tx: string) => {
    return this[requestMethodKey]({
      method: 'sendTransaction',
      params: { tx },
    });
  };
}

declare global {
  interface Window {
    zent: ZentProvider;
  }
}

function defineUnwritablePropertyIfPossible(
  o: Record<string, unknown>,
  p: string,
  value: unknown
) {
  const descriptor = Object.getOwnPropertyDescriptor(o, p);
  if (!descriptor || descriptor.writable) {
    if (!descriptor || descriptor.configurable) {
      Object.defineProperty(o, p, {
        value,
        writable: false,
      });
    } else {
      o[p] = value;
    }
  } else {
    console.warn(
      `[Zent] Failed to inject ${p}. Another wallet may be intercepting the namespace.`
    );
  }
}

const provider = new ZentProvider();
const providerProxy = new Proxy(provider, {
  deleteProperty: () => true,
  get: (target, prop) => {
    // Allow EventEmitter internals
    if (
      prop === '_events' ||
      prop === '_eventsCount' ||
      prop === '_maxListeners'
    ) {
      return (target as any)[prop];
    }
    // Block private method access
    if (
      (typeof prop === 'string' && prop.startsWith('_')) ||
      prop === requestMethodKey
    ) {
      console.warn(
        `[Zent] Access to private member "${String(prop)}" is not allowed.`
      );
      return undefined;
    }
    return (target as any)[prop];
  },
});

defineUnwritablePropertyIfPossible(window as any, 'zent', providerProxy);

window.dispatchEvent(new Event('zent#initialized'));
