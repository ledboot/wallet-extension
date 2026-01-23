/**
 * ZENT Wallet - 主流钱包 API 设计
 * 遵循 EIP-1193 标准和多链钱包设计模式
 * 
 * 使用方法：
 * 1. 引入库: <script src="https://gitee.com/zentrophy/wallet-extension/blob/develop/public/contentScriptZent.js"></script> 需要下载到本地
 * 2. 使用钱包: await window.zentWallet.connect()
 */

(function() {
    'use strict';

    // 钱包检测和初始化
    let isInitialized = false;
    let walletInstance = null;
    let eventListeners = new Map();

    // 消息队列处理
    const messageQueue = [];
    let messageId = 0;

    // ZENT Wallet 类 - 遵循主流钱包 API 设计
    class ZENTWallet {
        constructor() {
            this.isZENT = true;
            this.name = 'ZENT Wallet';
            this.version = '1.0.0';
            this.chainId = '0x1'; // 默认主网
        }
        
        // 连接钱包 - 返回账户信息
        async connect() {
            return this._request('CONNECT_WALLET');
        }

        // 断开连接
        async disconnect() {
            return this._request('DISCONNECT_WALLET');
        }
        
        //获取账户列表
        async getAccounts() {
            return this._request('GET_ACCOUNTS');
        }

        // 获取当前账户
        async getCurrentAccount() {
            return this._request('GET_CURRENT_ACCOUNT');
        }

        // 获取账户余额
        async getBalance(address, chainId) {
            return this._request('GET_BALANCE', { address, chainId });
        }
        
        // 获取当前网络
        async getNetwork() {
            return this._request('GET_NETWORK');
        }

        // 切换网络
        async switchNetwork(chainId) {
            return this._request('SWITCH_NETWORK', { chainId });
        }

        // 签名交易
        async signTransaction(tx) {
            return this._request('SIGN_TRANSACTION', { tx });
        }

        // 发送交易
        async sendTransaction(tx) {
            return this._request('SEND_TRANSACTION', { tx });
        }

        // 获取 UTXO
        async getUtxos(address, value) {
            return this._request('GET_UTXOS', { address, value });
        }

        // === 通用请求方法 (EIP-1193 兼容) ===
        async request(args) {
            if (typeof args === 'string') {
                // 兼容旧版本
                return this._request(args);
            } else if (args && args.method) {
                // EIP-1193 标准格式
                return this._request(args.method, args.params || {});
            } else {
                throw new Error('Invalid request format');
            }
        }

        // === 事件系统 (主流钱包标准) ===
        
        // 添加事件监听器
        on(event, callback) {
            if (!eventListeners.has(event)) {
                eventListeners.set(event, new Set());
            }
            eventListeners.get(event).add(callback);
        }

        // 移除事件监听器
        removeListener(event, callback) {
            if (eventListeners.has(event)) {
                eventListeners.get(event).delete(callback);
            }
        }

        // 移除所有监听器
        removeAllListeners(event = null) {
            if (event) {
                eventListeners.delete(event);
            } else {
                eventListeners.clear();
            }
        }

        // 触发事件
        _emit(event, data) {
            if (eventListeners.has(event)) {
                eventListeners.get(event).forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Event listener error for ${event}:`, error);
                    }
                });
            }
        }

        // === 内部实现 ===
        
        // 内部请求实现
        async _request(method, params = {}) {
            const id = ++messageId;
            
            return new Promise((resolve, reject) => {
                // 存储回调
                messageQueue[id] = { resolve, reject, method };

                // 发送消息到 content script
                window.postMessage({
                    target: 'ZENT_REQUEST',
                    id: id,
                    payload: { method, params }
                }, '*');

                // 超时处理
                setTimeout(() => {
                    if (messageQueue[id]) {
                        delete messageQueue[id];
                        reject(new Error('Request timeout'));
                    }
                }, 30000);
            });
        }
    }

    // 监听来自 content script 的响应
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        
        if (event.data.target === 'ZENT_RESPONSE' && event.data.id) {
            const { id, data } = event.data;
            console.log('收到响应:', { id, data });  // 添加调试日志
            
            if (messageQueue[id]) {
                const { resolve, reject, method } = messageQueue[id];
                delete messageQueue[id];
                
                if (data && data.success) {
                    resolve(data.result);
                } else {
                    reject(new Error(data?.error || 'Request failed'));
                }
            }
        }
    });

    // 初始化钱包实例
    function initWallet() {
        if (isInitialized) return;
        
        walletInstance = new ZENTWallet();
        window.zentWallet = walletInstance;
        window.ZENTWallet = ZENTWallet;
        
        // 兼容 EIP-1193
        window.ethereum = walletInstance;
        
        isInitialized = true;
        
        // 触发钱包就绪事件
        window.dispatchEvent(new CustomEvent('zentWalletReady'));
        
        console.log('ZENT Wallet initialized successfully');
    }

    // 检测钱包是否已存在
    function detectWallet() {
        // 检查是否由扩展注入
        if (window.myWallet) {
            initWallet();
            return true;
        }
        
        // 轮询检测
        let checkCount = 0;
        const checkInterval = setInterval(() => {
            checkCount++;
            
            if (window.myWallet) {
                clearInterval(checkInterval);
                initWallet();
            } else if (checkCount > 50) { // 5秒超时
                clearInterval(checkInterval);
                console.warn('ZENT Wallet extension not detected');
            }
        }, 100);
    }

    // 页面加载完成后开始检测
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', detectWallet);
    } else {
        detectWallet();
    }

})();
