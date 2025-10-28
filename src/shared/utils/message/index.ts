/**
 * this script is live in content-script / dapp's page
 */
import { EventEmitter } from 'eventemitter3';

export interface RequestData {
  ident: number;
  data: unknown;
}

export interface ResponseData {
  ident: number;
  res?: unknown;
  err?: {
    message: string;
    stack: string;
    code?: string;
    data?: unknown;
  };
}

interface WaitingItem {
  data: unknown;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

abstract class Message extends EventEmitter {
  // available id list
  // max concurrent request limit
  private _requestIdPool = [...Array(500).keys()];
  protected _EVENT_PRE = 'ANEX_WALLET_';
  protected listenCallback?: (data: unknown) => Promise<unknown>;

  private _waitingMap = new Map<number, WaitingItem>();

  abstract send(type: string, data: unknown): void;

  request = (data: unknown): Promise<unknown> => {
    if (!this._requestIdPool.length) {
      throw new Error('request id pool is empty');
    }
    const ident = this._requestIdPool.shift()!;

    return new Promise((resolve, reject) => {
      this._waitingMap.set(ident, {
        data,
        resolve,
        reject,
      });

      this.send('request', { ident, data });
    });
  };

  onResponse = async (
    { ident, res, err }: ResponseData = {} as ResponseData
  ) => {
    // the url may update
    if (!this._waitingMap.has(ident)) {
      return;
    }

    const { resolve, reject } = this._waitingMap.get(ident)!;

    this._requestIdPool.push(ident);
    this._waitingMap.delete(ident);
    err ? reject(err) : resolve(res);
  };

  onRequest = async ({ ident, data }: RequestData) => {
    console.log('[Message] onRequest received:', { ident, data });
    if (this.listenCallback) {
      let res: unknown, err: ResponseData['err'];

      try {
        res = await this.listenCallback(data);
        console.log('[Message] listenCallback result:', res);
      } catch (e: unknown) {
        const error = e as Error;
        console.log('[Message] listenCallback error:', error);
        err = {
          message: error.message,
          stack: error.stack || '',
        };
        if ((e as { code?: string }).code) {
          err.code = (e as { code: string }).code;
        }
        if ((e as { data?: unknown }).data) {
          err.data = (e as { data: unknown }).data;
        }
      }

      console.log('[Message] sending response:', { ident, res, err });
      this.send('response', { ident, res, err });
    }
  };

  _dispose = () => {
    for (const request of this._waitingMap.values()) {
      request.reject(new Error('User rejected request'));
    }

    this._waitingMap.clear();
  };
}

export default Message;
