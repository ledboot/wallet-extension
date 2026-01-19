// console.log('Inpage script loaded');

class MyWalletProvider {

  private requestId: number;
  private callbacks: Map<number, (data: any) => void>;
  // private requestId = 0;
  // private callbacks = new Map();

  constructor() {
    console.log('---------------constructor')
    this.requestId = 0;
    this.callbacks = new Map();
    window.addEventListener('message', (event) => {
        console.log('---------------constructor-message')
      if (event.source !== window) return;
      if (event.data.target === 'ZENT_RESPONSE') {
        const { id, data } = event.data;
        if (this.callbacks.has(id)) {
          // this.callbacks.get(id)(data);
          this.callbacks.get(id)?.(data);
          this.callbacks.delete(id);
        }
      }
    });
  }

  request(method: string, params: {}) {
    console.log('---------------request')
    const id = this.requestId++;

    return new Promise((resolve) => {
      this.callbacks.set(id, resolve);

      window.postMessage(
        {
          target: 'ZENT_REQUEST',
          id: id,
          payload: { method, params },
        },
        '*'
      );
    });
  }

  connect() {
    console.log('---------------正在请求连接...');
    return this.request('CONNECT_WALLET', {});
  }
}

window.myWallet = new MyWalletProvider();
console.log('MyWallet 初始化成功！');