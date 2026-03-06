import type BroadcastChannelMessage from '../../shared/utils/message/broadcastChannelMessage';
import type ReadyPromise from './readyPromise';
import { EventEmitter } from 'eventemitter3';

interface ProviderPrivate {
  _selectedAddress: string | null;
  _networkId: string | null;
  _isConnected: boolean;
  _initialized: boolean;
  _isUnlocked: boolean;
  _pushEventHandlers: PushEventHandlers | null;
  _requestPromise: ReadyPromise;
  _bcm: BroadcastChannelMessage;
}

class PushEventHandlers {
  provider: EventEmitter;
  _providerPrivate: ProviderPrivate;

  constructor(provider: EventEmitter, providerPrivate: ProviderPrivate) {
    this.provider = provider;
    this._providerPrivate = providerPrivate;
  }

  _emit(event: string, data?: unknown) {
    if (this._providerPrivate._initialized) {
      this.provider.emit(event, data);
    }
  }

  connect = (data?: unknown) => {
    if (!this._providerPrivate._isConnected) {
      this._providerPrivate._isConnected = true;
      this._emit('connect', data);
    }
  };

  unlock = () => {
    this._providerPrivate._isUnlocked = true;
  };

  lock = () => {
    this._providerPrivate._isUnlocked = false;
    this._emit('accountsChanged', []);
  };

  disconnect = () => {
    this._providerPrivate._isConnected = false;
    this._providerPrivate._selectedAddress = null;
    this._emit('accountsChanged', []);
    this._emit('disconnect', { code: 4900, message: 'Provider disconnected' });
  };

  accountsChanged = (accounts: string[]) => {
    if (accounts?.[0] === this._providerPrivate._selectedAddress) {
      return;
    }
    this._providerPrivate._selectedAddress = accounts?.[0] ?? null;
    this._emit('accountsChanged', accounts);
  };

  networkChanged = ({ networkId }: { networkId: string }) => {
    this.connect();

    if (networkId !== this._providerPrivate._networkId) {
      this._providerPrivate._networkId = networkId;
      this._emit('networkChanged', networkId);
    }
  };
}

export default PushEventHandlers;
