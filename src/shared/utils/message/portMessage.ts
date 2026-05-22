import { browserRuntimeConnect } from '@/background/webapi/browser';

import Message, { RequestData, ResponseData } from './index';

class PortMessage extends Message {
  port: any | null = null;
  listenCallback: any = null;

  constructor(port?: any) {
    super();

    if (port) {
      this.port = port;
    }
  }

  private portName?: string;

  connect = (name?: string) => {
    if (name !== undefined) {
      this.portName = name;
    }
    this.port = browserRuntimeConnect(undefined, this.portName ? { name: this.portName } : undefined);
    this.port.onMessage.addListener(
      ({ _type_, data }: { _type_: string; data: unknown }) => {
        if (_type_ === `${this._EVENT_PRE}message`) {
          this.emit('message', data);
          return;
        }

        if (_type_ === `${this._EVENT_PRE}response`) {
          this.onResponse(data as ResponseData);
        }
      }
    );

    this.port.onDisconnect.addListener(() => {
      console.warn(`[PortMessage] Port ${this.portName || ''} disconnected.`);
      this.port = null;
      this._dispose(new Error('Extension port disconnected'));
    });

    if (this.listenCallback) {
      this.port.onMessage.addListener(
        ({ _type_, data }: { _type_: string; data: unknown }) => {
          if (_type_ === `${this._EVENT_PRE}request`) {
            this.onRequest(data as RequestData);
          }
        }
      );
    }

    return this;
  };

  listen = (listenCallback: any) => {
    this.listenCallback = listenCallback;
    if (!this.port) return this;
    this.port.onMessage.addListener(
      ({ _type_, data }: { _type_: string; data: unknown }) => {
        if (_type_ === `${this._EVENT_PRE}request`) {
          this.onRequest(data as RequestData);
        }
      }
    );

    return this;
  };

  send = (type: string, data: unknown) => {
    if (!this.port) {
      if (this.portName) {
        try {
          this.connect();
        } catch (e) {
          console.error('[PortMessage] auto-reconnect failed:', e);
          throw new Error('Port is disconnected and auto-reconnect failed');
        }
      } else {
        throw new Error('Port is disconnected and cannot be reconnected');
      }
    }
    try {
      const message = { _type_: `${this._EVENT_PRE}${type}`, data };
      this.port.postMessage(message);
    } catch (e) {
      console.error('[PortMessage] send error:', e);
      if (this.portName) {
        try {
          console.log('[PortMessage] Attempting to reconnect and retry...');
          this.port = null;
          this.connect();
          const message = { _type_: `${this._EVENT_PRE}${type}`, data };
          this.port.postMessage(message);
        } catch (retryError) {
          console.error('[PortMessage] retry failed:', retryError);
          throw retryError;
        }
      } else {
        throw e;
      }
    }
  };

  dispose = () => {
    this._dispose();
    this.port?.disconnect();
  };
}

export default PortMessage;
