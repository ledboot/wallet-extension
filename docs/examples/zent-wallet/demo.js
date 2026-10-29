// 无依赖 JavaScript 示例；TypeScript 项目请参考 wallet-client.ts。
const element = (id) => document.getElementById(id);
const buttons = [...document.querySelectorAll('button')];
let zent;
let session = null;
let signedTransaction = '';
let networks = {};
let busy = false;

function show(value) {
  element('output').textContent = JSON.stringify(value, null, 2);
}

function clearSession() {
  session = null;
  signedTransaction = '';
  element('broadcast').disabled = true;
  element('status').textContent = '本页未连接，请点击连接钱包';
}

function sameNetwork(left, right) {
  return left.id === right.id && left.chainId === right.chainId && left.rpcUrl === right.rpcUrl;
}

async function checkContext() {
  if (!zent || !session) throw new Error('请先连接钱包');
  const expected = session;
  const [account, network] = await Promise.all([zent.getCurrentAccount(), zent.getNetwork()]);
  if (session !== expected || account?.address !== expected.address || !sameNetwork(network, expected.network)) {
    clearSession();
    throw new Error('账户或网络已变化，请重新连接并重新构造交易');
  }
  return { address: account.address, network };
}

function transactionHex() {
  const hex = element('raw-tx').value.trim();
  if (!/^(?:[0-9a-fA-F]{2})+$/.test(hex)) throw new Error('请输入完整交易 hex，不含 0x');
  return hex;
}

async function run(action) {
  if (busy) return;
  busy = true;
  buttons.forEach((button) => {
    button.disabled = true;
  });
  try {
    if (!zent) throw new Error('未检测到 ZENT 钱包，请安装或启用扩展并刷新本页');
    await action();
  } catch (error) {
    show({ error: error?.message ?? String(error) });
  } finally {
    busy = false;
    buttons.forEach((button) => {
      button.disabled = false;
    });
    element('broadcast').disabled = !signedTransaction || !session;
  }
}

const actions = {
  connect: async () => {
    clearSession();
    const accounts = await zent.requestAccounts();
    const current = await zent.getCurrentAccount();
    if (!accounts[0] || current?.address !== accounts[0]) {
      throw new Error('请在钱包内切换到连接时选择的账户，然后重新连接');
    }
    const network = await zent.getNetwork();
    networks = await zent.getNetworks();
    session = { address: accounts[0], network };
    element('networks').replaceChildren(
      ...Object.entries(networks).map(([key, config]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${config.name} / ${key} / ${config.endpoints[0] ?? ''}`;
        return option;
      })
    );
    element('status').textContent = `已连接 ${session.address} | ${network.name} | ${network.rpcUrl}`;
    show({ accounts, network });
  },
  disconnect: async () => {
    // 本地清理不依赖钱包是否成功响应断开。
    clearSession();
    show(await zent.disconnect());
  },
  query: async () => {
    const { address, network } = await checkContext();
    const utxos = await zent.getCurrentAccountUtxos();
    const balance = await zent.getBalance(address, network.chainId);
    await checkContext();
    if (utxos.some((utxo) => !Number.isSafeInteger(utxo.value))) {
      throw new Error('UTXO 金额超出安全整数范围，不可用于本示例构造交易');
    }
    show({ address, network, balance, utxos });
  },
  switch: async () => {
    const key = element('networks').value;
    const target = networks[key];
    if (!target) throw new Error('请先连接并选择网络');
    const matches = Object.values(networks).filter((item) => item.chainId === target.chainId);
    if (matches.length !== 1) {
      throw new Error('多个网络使用相同 chainId，请在钱包内手动切换后重新连接');
    }
    clearSession();
    const result = await zent.switchNetwork(target.chainId);
    const actual = await zent.getNetwork();
    if (actual.id !== target.id || actual.rpcUrl !== target.endpoints[0]) {
      throw new Error('返回网络与目标配置不一致，请在钱包内手动核对');
    }
    show({ result, network: actual, next: '请重新连接钱包' });
  },
  'sign-message': async () => {
    const context = await checkContext();
    const message = element('message').value;
    if (!message) throw new Error('消息不能为空');
    const signature = await zent.signMessage(message);
    await checkContext();
    show({ address: context.address, message, signature });
  },
  simulate: async () => {
    await checkContext();
    const response = await zent.tryContract(transactionHex());
    await checkContext();
    if (response.error) throw new Error(JSON.stringify(response.error));
    show(response);
  },
  'sign-tx': async () => {
    await checkContext();
    signedTransaction = '';
    const rawHex = transactionHex();
    const result = await zent.signTransaction(rawHex);
    await checkContext();
    if (transactionHex() !== rawHex) throw new Error('交易内容已修改，请重新签名');
    signedTransaction = result.signedTransaction;
    show(result);
  },
  broadcast: async () => {
    await checkContext();
    if (!signedTransaction) throw new Error('请先完成交易签名');
    const hex = signedTransaction;
    signedTransaction = ''; // 广播结果不明时也不允许直接重复点击。
    show(await zent.sendTransaction(hex));
  },
  call: async () => {
    await checkContext();
    const address = element('contract').value.trim();
    const params = element('params').value.trim();
    if (!address || !params) throw new Error('请输入合约地址和已编码参数');
    const response = await zent.contractCall(address, params);
    await checkContext();
    if (response.error) throw new Error(JSON.stringify(response.error));
    show(response);
  },
};

for (const [id, action] of Object.entries(actions)) {
  element(id).addEventListener('click', () => {
    void run(action);
  });
}
element('raw-tx').addEventListener('input', () => {
  signedTransaction = '';
  element('broadcast').disabled = true;
});

async function detectZent() {
  if (window.zent) return window.zent;
  await new Promise((resolve) => {
    const finish = () => {
      window.removeEventListener('zent#initialized', finish);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, 1500);
    window.addEventListener('zent#initialized', finish, { once: true });
    if (window.zent) finish();
  });
  return window.zent;
}

zent = await detectZent();
element('status').textContent = zent ? '已检测到 ZENT 钱包，请连接' : '未检测到钱包，请启用扩展并刷新';
if (zent) {
  // 账户/网络变化时废弃当前上下文，要求用户重新主动连接。
  const handleChange = () => {
    if (session) clearSession();
  };
  zent.on('accountsChanged', handleChange);
  zent.on('networkChanged', handleChange);
  zent.on('disconnect', handleChange);
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    zent.off('accountsChanged', handleChange);
    zent.off('networkChanged', handleChange);
    zent.off('disconnect', handleChange);
  });
}
