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

  connect = (name?: string) => {
    this.port = browserRuntimeConnect(undefined, name ? { name } : undefined);
    this.port.onMessage.addListener(
      ({ _type_, data }: { _type_: string; data: unknown }) => {
        console.log('[PortMessage] connect received message:', { _type_, data });
        if (_type_ === `${this._EVENT_PRE}message`) {
          this.emit('message', data);
          return;
        }

        if (_type_ === `${this._EVENT_PRE}response`) {
          console.log('[PortMessage] handling response');
          this.onResponse(data as ResponseData);
        }
      }
    );

    return this;
  };

  listen = (listenCallback: any) => {
    if (!this.port) return;
    this.listenCallback = listenCallback;
    this.port.onMessage.addListener(
      ({ _type_, data }: { _type_: string; data: unknown }) => {
        console.log('[PortMessage] listen received message:', { _type_, data });
        if (_type_ === `${this._EVENT_PRE}request`) {
          console.log('[PortMessage] handling request');
          this.onRequest(data as RequestData);
        }
      }
    );

    return this;
  };

  send = (type: string, data: unknown) => {
    if (!this.port) {
      console.log('[PortMessage] send: port is null');
      return;
    }
    try {
      const message = { _type_: `${this._EVENT_PRE}${type}`, data };
      console.log('[PortMessage] sending:', message);
      this.port.postMessage(message);
    } catch (e) {
      console.error('[PortMessage] send error:', e);
    }
  };

  dispose = () => {
    this._dispose();
    this.port?.disconnect();
  };
}

export default PortMessage;
