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
        if (_type_ === `${this._EVENT_PRE}message`) {
          this.emit('message', data);
          return;
        }

        if (_type_ === `${this._EVENT_PRE}response`) {
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
        if (_type_ === `${this._EVENT_PRE}request`) {
          this.onRequest(data as RequestData);
        }
      }
    );

    return this;
  };

  send = (type: string, data: unknown) => {
    if (!this.port) return;
    try {
      this.port.postMessage({ _type_: `${this._EVENT_PRE}${type}`, data });
    } catch (e) {
      // DO NOTHING BUT CATCH THIS ERROR
    }
  };

  dispose = () => {
    this._dispose();
    this.port?.disconnect();
  };
}

export default PortMessage;
