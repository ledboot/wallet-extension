# ZENT 插件钱包接入指南（第三方开发者）

通过浏览器注入的 `window.zent`，你的网站可以请求连接 ZENT 钱包、查询账户与网络、
签署消息、签名并广播交易，以及调用 SmallC 合约。无需安装钱包 SDK，也无需知道扩展 ID。
所有钱包操作均在浏览器客户端执行；React / Next.js 项目请在客户端组件中调用。

适用版本：ZENT Wallet Extension `1.0.2`

## 1. 先运行完整示例

本目录提供一个普通 HTML + JavaScript 示例，复制整个目录即可使用：

[下载/查看示例目录](examples/zent-wallet/README.md)

```text
zent-wallet/
├── index.html           # 示例页面
├── demo.js              # 网页直接调用 window.zent，无第三方依赖
├── zent-provider.ts     # TypeScript 类型，可复制到你的项目
└── wallet-client.ts     # TypeScript 接入封装，可复制到你的项目
```

在仓库根目录运行：

```bash
python3 -m http.server 8080 --bind 127.0.0.1 --directory docs/examples/zent-wallet
```

然后在安装了 ZENT 钱包的浏览器中打开 `http://127.0.0.1:8080`。
如果只拿到了示例目录，在该目录内运行 `python3 -m http.server 8080 --bind 127.0.0.1` 即可。

1. 在钱包中准备测试账户并选择测试网络，确认扩展允许访问本地页面。
2. 点击“连接钱包”，在钱包弹窗中选择**与钱包当前活动账户相同**的地址并确认。
3. 点击查询按钮，查看地址、网络、余额和 UTXO。
4. 点击消息签名按钮，确认后查看签名 hex。
5. 需要测试交易时，粘贴目标网络的完整交易 hex，先模拟或签名，再单独点击广播。
6. 需要测试合约时，填写已部署合约地址及 ABI 编码参数，点击查询。

预期现象：连接、消息签名、交易签名、广播、切网会打开对应确认窗口；
余额查询、UTXO 查询、合约模拟和查询不单独弹出审批窗口。
未检测到钱包时，先确认扩展已启用并允许访问该网页，再刷新页面。
浏览器内部页面及第三方 iframe 不作为本示例的接入环境。

## 2. 最小接入：连接钱包

下面是一个可直接保存为 `index.html` 的最小示例。通过 HTTP 服务打开，
点击按钮即可发起连接；在钱包弹窗确认后，页面显示连接地址和网络。

```html
<!doctype html>
<html lang="zh-CN">
  <meta charset="UTF-8" />
  <title>连接 ZENT 钱包</title>
  <button id="connect">连接 ZENT 钱包</button>
  <pre id="result">等待连接</pre>
  <script>
    const button = document.getElementById('connect');
    const result = document.getElementById('result');
    button.onclick = async () => {
      button.disabled = true;
      try {
        const zent = window.zent;
        if (!zent) throw new Error('请安装或启用 ZENT 钱包，然后刷新页面');
        const accounts = await zent.requestAccounts();
        const current = await zent.getCurrentAccount();
        if (!accounts[0] || accounts[0] !== current?.address) {
          throw new Error('请在钱包内切换到连接时选择的账户，再重新连接');
        }
        const network = await zent.getNetwork();
        result.textContent = JSON.stringify({ address: accounts[0], network }, null, 2);
      } catch (error) {
        result.textContent = error?.message || String(error);
      } finally {
        button.disabled = false;
      }
    };
  </script>
</html>
```

返回示例（地址与网络配置以你的钱包为准）：

```ts
// requestAccounts()
['<用户确认连接的地址>']

// getNetwork()：数字 id 是网络配置 ID，不是 chainId
{
  id: 1,
  name: 'ZENT',
  rpcUrl: 'http://207.246.106.17:7789',
  chainId: 1,
  icon: ''
}
```

完整示例的 `demo.js` 还会等待 `zent#initialized` 注入事件，最多等待 1.5 秒。
该事件只说明 Provider 已挂载；用户主动调用 `requestAccounts()` 后，才能在业务上建立本次连接。
不要在页面加载时自动弹出连接或签名窗口。

## 3. TypeScript 项目接入

把以下两个文件复制到你的项目同一目录，例如 `src/wallet/`：

- [zent-provider.ts](examples/zent-wallet/zent-provider.ts)：Provider 类型及 `Window` 声明。
- [wallet-client.ts](examples/zent-wallet/wallet-client.ts)：检测、连接、上下文校验、签名和广播封装。

它们是示例源码，不是已经发布到 npm 的包，不需要安装名为 `zent-sdk` 的依赖。
下面示例都在浏览器中执行；导入路径根据你的项目目录调整。

```ts
import type { WalletSession } from './wallet/wallet-client';
import type { ZentProvider } from './wallet/zent-provider';

import { connectWallet, detectZent } from './wallet/wallet-client';

let provider: ZentProvider | null = null;
let session: WalletSession | null = null;

// 绑定到“连接钱包”按钮。检测过程不会请求用户授权。
async function handleConnect(): Promise<void> {
  provider = await detectZent();
  if (!provider) throw new Error('请安装或启用 ZENT 钱包并刷新页面');
  session = await connectWallet(provider);
  console.log('连接地址', session.address);
  console.log('当前网络', session.network);
}

// 绑定到“断开”按钮。UI 状态应在调用后同步清空。
async function handleDisconnect(): Promise<void> {
  session = null;
  if (provider) await provider.disconnect();
}
```

上述封装返回 `{ address, network }`，应用应保留这份上下文，
在签名前、广播前确认账户与网络仍一致。账户或网络改变后，应重新连接、重新构造交易。
不要将 `getAccounts()` 的第一项直接当作用户本次授权的地址：当前版本该方法可能返回全部钱包地址。

## 4. 按场景调用

以下片段使用已取得的 `zent: ZentProvider` 和连接时保存的 `session: WalletSession`。
所有异步方法都应在按钮处理函数中捕获错误，防止重复点击；错误提示方法见第 8 节。

### 4.1 查询当前账户、余额和 UTXO

```ts
import type { WalletSession } from './wallet/wallet-client';
import type { ZentProvider } from './wallet/zent-provider';

import { assertWalletContext } from './wallet/wallet-client';

async function loadAssets(zent: ZentProvider, session: WalletSession): Promise<void> {
  await assertWalletContext(zent, session);
  const current = await zent.getCurrentAccount();
  // 先刷新 UTXO，再读取钱包缓存余额。chainId 显式传入。
  const utxos = await zent.getCurrentAccountUtxos();
  const balance = await zent.getBalance(session.address, session.network.chainId);
  await assertWalletContext(zent, session);
  if (utxos.some((utxo) => !Number.isSafeInteger(utxo.value))) {
    throw new Error('UTXO 金额超出 JS 安全整数范围');
  }
  console.log('当前地址', current?.address);
  console.log('余额摘要', balance);
  console.log('可用于构造交易的 UTXO', utxos);
}
```

UTXO 数据示意（展示结构，不可直接拿来构造真实交易）：

```ts
[
  {
    txid: '<真实的前序交易 hash>',
    index: 0,
    address: '<所属地址>',
    value: 100000,
    tokenType: '0',
    scriptPubKey: '<锁定脚本 hex>',
    blockHeight: 123,
    blockHash: '<区块 hash>',
    rights: [],
  },
];
```

`value` 是链上整数单位，不是经过小数格式化后的币数量。
`getBalance()` 返回的是缓存中的第一条匹配资产摘要，不是全币种余额列表；
无结果时可能只有 `{ address, balance: 0 }`。UTXO 刷新失败时也可能返回缓存。

### 4.2 列出网络并切换

`getNetworks()` 返回映射，用 `Object.entries()` 生成下拉选项。
选择目标配置后，把它的 `chainId` 传入 `switchNetwork()`：

```ts
async function selectNetwork(zent: ZentProvider, targetKey: string): Promise<void> {
  const networks = await zent.getNetworks();
  const target = networks[targetKey];
  if (!target) throw new Error('目标网络不存在');

  const matches = Object.values(networks).filter((item) => item.chainId === target.chainId);
  if (matches.length !== 1) {
    throw new Error('多个网络使用相同 chainId，请在钱包内手动切换后重新连接');
  }

  const result = await zent.switchNetwork(target.chainId);
  const actual = await zent.getNetwork();
  if (actual.id !== target.id || actual.rpcUrl !== target.endpoints[0]) {
    throw new Error('切换结果与目标网络不同，请手动核对');
  }
  console.log(result); // { switched: true, networkId: '<网络配置键>' }
  // 应用清空旧账户上下文、UTXO 和待签交易，并要求重新连接。
}
```

`targetKey` 使用实际映射键，不应随意编写。可先打印：

```ts
const networks = await zent.getNetworks();
console.table(
  Object.entries(networks).map(([key, item]) => ({
    key,
    name: item.name,
    chainId: item.chainId,
    rpc: item.endpoints[0],
  }))
);
```

当前内置主网和测试网 `chainId` 都为 `1`，接口不能仅凭 `1` 区分它们。
遇到重复时请引导用户在钱包内手动选择，再读取 `getNetwork()` 确认。

### 4.3 签署消息

```ts
async function signText(zent: ZentProvider, session: WalletSession): Promise<string> {
  await assertWalletContext(zent, session);
  const message = [
    'ZENT wallet integration test',
    `Domain: ${window.location.host}`,
    `Address: ${session.address}`,
    `Time: ${new Date().toISOString()}`,
  ].join('\n');
  const signature = await zent.signMessage(message);
  await assertWalletContext(zent, session);
  console.log({ address: session.address, message, signature });
  return signature; // 64 字节 r || s 的 hex 字符串
}
```

这是文本签名示例。用于登录时，消息必须来自服务端的一次性挑战，
由服务端绑定地址、公钥、域名、nonce 和过期时间并验签；不能仅凭签名字符串登录。
精确签名与验签规则见第 9 节。

### 4.4 模拟完整交易

```ts
async function simulate(zent: ZentProvider, rawTxHex: string): Promise<unknown> {
  const response = await zent.tryContract(rawTxHex);
  if (response.error) throw new Error(JSON.stringify(response.error));
  console.log('模拟结果', response.result);
  return response.result;
}
```

`rawTxHex` 必须是目标网络的完整交易，不能把方法名、JSON、合约 ABI 或一段任意 hex 传进去。
模拟是否可使用未签名交易取决于目标节点和交易类型；按对应节点要求生成交易。

### 4.5 签名后广播

```ts
import { broadcastSignedTransaction, signRawTransaction } from './wallet/wallet-client';

async function submitTransaction(zent: ZentProvider, session: WalletSession, rawTxHex: string): Promise<string> {
  // 前提：应用已经核对输入、输出、找零、手续费及目标网络。
  const signedHex = await signRawTransaction(zent, session, rawTxHex);
  // 原生返回 { signedTransaction }，上面封装已取出字符串。
  const txHash = await broadcastSignedTransaction(zent, session, signedHex);
  // 原生返回 { txHash }，上面封装已取出字符串。
  console.log('节点已接收交易', txHash);
  return txHash;
}
```

上述流程会依次出现**签名确认、广播确认**两个窗口，拒绝签名后不会继续广播。
`sendTransaction()` 只广播传入的已签名 hex，不会替你签名。
返回 hash 不表示链上已确认，需要应用另行通过节点查询交易状态。
若广播超时，先核对交易状态，不要直接重复发起业务交易。
完整网页示例把签名与广播分成两个按钮，方便逐步联调。

**完整交易 hex 从哪里来？**

钱包 Provider 不提供交易构造接口。普通交易由应用使用兼容 ZENT 的交易编码工具构造；
SmallC 合约部署/调用可以参考已有 smallc-ide 的构造流程。
没有可通用复制的静态交易 hex，因为输入的 txid、输出地址、UTXO 金额、网络和找零都随账户变化。

下面是把 smallc-ide 部署逻辑抽成函数的例子。它需要在已具备 SmallC 编码工具的项目中运行：
`@/utils/*` 是 smallc-ide 的源码模块路径，**不是钱包注入对象或已发布 npm 包**。
移植时一并引入兼容的编码模块及其依赖，并调整导入路径。

```ts
// 以下四个导入使用 smallc-ide 的现有路径。
import { Address } from '@/utils/address';
import { TinDef, ToutDef } from '@/utils/defs';
import { bytesToHex2 } from '@/utils/index';
import { MsgT } from '@/utils/msgTools';

async function buildDeploymentHex(
  zent: ZentProvider,
  session: WalletSession,
  contractHash: string,
  bytecode: string,
  fee: bigint
): Promise<string> {
  // contractHash 和 bytecode 来自 SmallC 编译产物；fee 由应用按目标网络确定。
  await assertWalletContext(zent, session);
  if (fee <= 0n) throw new Error('手续费必须大于零');
  if (![contractHash, bytecode].every((hex) => /^(?:[0-9a-fA-F]{2})+$/.test(hex))) {
    throw new Error('编译产物必须为完整 hex');
  }
  const utxos = await zent.getCurrentAccountUtxos();
  const input = utxos.find(
    (utxo) =>
      utxo.address === session.address &&
      /^(?:0+)?$/.test(utxo.tokenType) &&
      Number.isSafeInteger(utxo.value) &&
      BigInt(utxo.value) > fee
  );
  if (!input) throw new Error('没有足额的单笔原生币 UTXO');

  const tx = new MsgT();
  tx.version = 0x11;
  const vin = new TinDef();
  vin.previousOutPoint = { hash: input.txid, index: input.index };
  vin.signatureIndex = 0;
  vin.sequence = 0xffffffff;
  tx.tIn.push(vin);

  const deployment = new ToutDef();
  deployment.tokenType = 0n;
  deployment.value = 0n;
  deployment.pkScript = '88' + contractHash + '00000000' + bytecode;

  const change = new ToutDef();
  change.tokenType = 0n;
  change.value = BigInt(input.value) - fee;
  change.pkScript = Address.toPkScript(session.address);
  tx.tOut.push(deployment, change);
  tx.lockTime = 0;
  tx.signatureScripts = [];
  await assertWalletContext(zent, session);
  return bytesToHex2(tx.encode(0));
}
```

调用顺序是 `buildDeploymentHex(...) → signRawTransaction(...) → broadcastSignedTransaction(...)`。
本例只处理单个足额原生币输入；手续费、找零最低值及合约产物格式需按目标网络规则确认。
签名器会跳过缓存中未匹配到的输入，所以签名接口返回成功不代表任意交易所有输入都已签好。

### 4.6 查询合约

```ts
async function queryContract(zent: ZentProvider, contractAddress: string, encodedParams: string): Promise<unknown> {
  const response = await zent.contractCall(contractAddress, encodedParams);
  if (response.error) throw new Error(JSON.stringify(response.error));
  console.log('合约返回值', response.result);
  return response.result;
}
```

`contractAddress` 是当前网络已部署合约的地址。
`encodedParams` 由该合约的 SmallC ABI/工具编码生成，通常包含方法选择及编码参数；
不能直接传 `'getBalance'`、JavaScript 参数数组或套用 EVM ABI 编码。
返回值需按合约约定解码。完整网页示例可输入真实地址和编码参数直接测试。

## 5. 账户和网络事件

事件只用于同步界面；签名前仍需主动调用 `getCurrentAccount()`、`getNetwork()` 校验。
当前版本不保证所有钱包 UI 切网都能触发正确的 `networkChanged`。

```ts
function watchWallet(zent: ZentProvider, invalidate: () => void): () => void {
  const handleAccountsChanged = (accounts: string[]): void => {
    console.log('账户变化', accounts);
    invalidate(); // 清空连接会话、UTXO 和待签交易，要求重新连接。
  };
  const handleNetworkChanged = (): void => {
    invalidate(); // 不依赖事件参数，重新读取 getNetwork()。
  };
  const handleDisconnect = (): void => {
    invalidate();
  };
  zent.on('accountsChanged', handleAccountsChanged);
  zent.on('networkChanged', handleNetworkChanged);
  zent.on('disconnect', handleDisconnect);
  return (): void => {
    zent.off('accountsChanged', handleAccountsChanged);
    zent.off('networkChanged', handleNetworkChanged);
    zent.off('disconnect', handleDisconnect);
  };
}
```

React 中在 `useEffect` 注册，并返回上面的清理函数；不要在每次 render 重复注册。
`connect` 是 Provider 通信事件，不等于站点授权；`accountsChanged: []` 应清空账户状态。
`disconnect()` 当前不会自动触发断开事件，应用点击断开后需要自己清理状态。

## 6. 接口速查

所有业务方法返回 Promise。表内“无需确认”表示该处理分支没有调用审批窗口，
不代表锁定状态下也一定能成功。

| 方法与参数                                              | 成功返回                                | 用户确认               | 第三方用途                                 |
| ------------------------------------------------------- | --------------------------------------- | ---------------------- | ------------------------------------------ |
| `requestAccounts()`                                     | `string[]`                              | 连接确认；锁定时需解锁 | 请求连接；当前选择 UI 只选择一个地址       |
| `disconnect()`                                          | `{ disconnected: true }`                | 无需确认               | 见兼容说明；应用还需清理本地状态           |
| `getAccounts()`                                         | `string[]`                              | 无需确认               | 当前实现返回 keyring 中全部账户地址        |
| `getCurrentAccount()`                                   | 账户对象或空值                          | 无需确认               | 获取钱包当前活动账户；仅提取业务需要的字段 |
| `getNetwork()`                                          | `CurrentNetwork`                        | 无需确认               | 读取当前网络和首个 RPC 地址                |
| `getNetworks()`                                         | `Record<string, NetworkConfig>`         | 无需确认               | 获取网络配置映射，不是数组                 |
| `switchNetwork(chainId: number)`                        | `{ switched: true, networkId: string }` | 切网确认               | 根据数值 `chainId` 查找目标网络            |
| `getBalance(address: string, chainId?: number)`         | `Balance`                               | 无需确认               | 读取缓存余额摘要，不是全部资产列表         |
| `getCurrentAccountUtxos()`                              | `Utxo[]`                                | 无需确认               | 刷新资产后获取当前账户、当前链 UTXO        |
| `signTransaction(tx: string)`                           | `{ signedTransaction: string }`         | 签名确认               | 签名原始交易 hex；不会广播                 |
| `sendTransaction(tx: string)`                           | `{ txHash: string }`                    | 广播确认               | 广播已签名 hex；不会先替调用方签名         |
| `tryContract(tx: string)`                               | `RpcResponse<unknown>`                  | 无需确认               | 调用节点 `trycontract` 模拟交易            |
| `contractCall(contractAddress: string, params: string)` | `RpcResponse<unknown>`                  | 无需确认               | 调用节点 `contractcall`，参数须提前编码    |
| `signMessage(message: string)`                          | 签名 hex 字符串                         | 消息签名确认           | 使用当前活动账户签署非空文本               |

最小连接能力：发现 Provider、`requestAccounts`、`getCurrentAccount`、`getNetwork`、
`disconnect` 和状态事件。交易场景再接 `getCurrentAccountUtxos`、`signTransaction`、
`sendTransaction`；合约场景再接 `tryContract`、`contractCall`。

### 返回值的实际边界

- `getNetwork().id` 来自数值配置 ID；`getNetworks()` 的键及切网结果的 `networkId`
  则是字符串配置键。不要把它们当成同一个字段，也不要假设它们等于 `chainId`。
- `getNetworks()` 保留原配置字段，另加 `name`（来自 `label`）和展开后的 `icon`；
  RPC 地址在 `endpoints` 中，不保证有 `rpcUrl`。
- `getBalance()` 命中缓存时仅取筛选结果的第一项；未指定 `chainId` 时，
  该分支没有主动限制为当前链。不能据此判断所有代币或跨链总余额。
  无结果时仅返回 `{ address, balance: 0 }`，其余字段缺失。
- `getCurrentAccountUtxos()` 刷新失败后仍可能返回缓存；没有最低金额参数。
  返回空数组或缓存不等于链上最终可花费状态。
- 当前金额以 JS `number` 返回。超过安全整数范围可能丢精度；事后转换为 `bigint`
  不能恢复精度，第三方需要检测并拒绝不安全整数。

## 7. 完整 TypeScript 类型

可直接复制 [zent-provider.ts](examples/zent-wallet/zent-provider.ts)。
`getCurrentAccount()` 实际可能带有更多账户字段；第三方只依赖自己需要的地址和公钥字段。
`RpcResponse.result` 因节点、合约而异，请按业务校验。

```ts
export interface CurrentNetwork {
  id: number;
  name: string;
  rpcUrl?: string;
  chainId: number;
  icon: string;
}

export interface NetworkConfig {
  id: number;
  chainId: number;
  name: string;
  label: string;
  endpoints: string[];
  icon: string;
  iconLabel: string;
  unit: string;
  networkType: 'mainnet' | 'testnet';
  updated: number;
  explorerUrl?: string;
  isCustom?: boolean;
}

export interface Balance {
  address: string;
  balance: number;
  decimals?: number;
  formatted?: number;
  symbol?: string;
}

export interface Utxo {
  txid: string;
  index: number;
  address: string;
  value: number;
  tokenType: string;
  scriptPubKey: string;
  blockHeight: number;
  blockHash: string;
  rights: string[];
}

export interface RpcResponse<T> {
  id: number | string;
  error: unknown;
  result: T;
}

export interface ZentProvider {
  requestAccounts(): Promise<string[]>;
  disconnect(): Promise<{ disconnected: true }>;
  getAccounts(): Promise<string[]>;
  getCurrentAccount(): Promise<{ address: string; pubkey?: string } | null | undefined>;
  getNetwork(): Promise<CurrentNetwork>;
  getNetworks(): Promise<Record<string, NetworkConfig>>;
  switchNetwork(chainId: number): Promise<{ switched: true; networkId: string }>;
  getBalance(address: string, chainId?: number): Promise<Balance>;
  getCurrentAccountUtxos(): Promise<Utxo[]>;
  signTransaction(tx: string): Promise<{ signedTransaction: string }>;
  sendTransaction(tx: string): Promise<{ txHash: string }>;
  tryContract(tx: string): Promise<RpcResponse<unknown>>;
  contractCall(address: string, params: string): Promise<RpcResponse<unknown>>;
  signMessage(message: string): Promise<string>;
  on(event: 'accountsChanged', listener: (accounts: string[]) => void): this;
  on(event: 'networkChanged', listener: (networkId: string) => void): this;
  on(event: 'connect', listener: (data: unknown) => void): this;
  on(event: 'disconnect', listener: (data: unknown) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
}

declare global {
  interface Window {
    zent?: ZentProvider;
  }
}
```

## 8. 错误处理

```ts
import { getErrorMessage } from './wallet/wallet-client';

async function handleSignClick(): Promise<void> {
  try {
    // 调用你的签名或广播函数，并在等待期间禁用对应按钮。
  } catch (error: unknown) {
    console.error(getErrorMessage(error)); // UI 展示此文本，不直接展示 stack。
  }
}
```

普通调用失败会 reject；跨通信层返回值可能是普通对象，不保证 `instanceof Error`。
常见形态为 `{ message, stack, code?, data? }`，当前没有统一业务错误码。
不要依赖所有用户拒绝都会返回 `4001`，也不要把 disconnect 事件的 `4900` 当作所有失败的代码。

| 当前消息示例                                                                    | 应用处理                               |
| ------------------------------------------------------------------------------- | -------------------------------------- |
| `User rejected request`                                                         | 用户拒绝，停止后续签名或广播           |
| `User closed the window`                                                        | 用户关闭审批窗口，允许重新主动发起     |
| `Unsupported chainId: ...`                                                      | 提示选择钱包已有网络                   |
| `Missing transaction data` / `Invalid transaction hex string format`            | 检查编码及入参                         |
| `Missing contract address` / `Missing contract call params` / `Missing message` | 检查非空参数                           |
| `No current account` / `No active account`                                      | 引导用户解锁或选择账户                 |
| `Network error, ...` / 节点错误消息                                             | 显示失败原因；广播失败需先核对链上状态 |

`tryContract` 和 `contractCall` 还会直接返回 RPC 包装对象：即使 Promise resolve，
也必须检查 `response.error`。`sendTransaction` 会将节点 `error` 转为 reject。
普通错误提示优先取 `error.message`，无法取得时使用通用提示，不向终端用户展示内部 stack。

检测注入可设置超时，但钱包业务请求没有统一取消接口，页面超时不代表钱包已取消。
页面隐藏时请求可能排队等待页面重新可见。需要用户确认的操作应串行发起。

## 9. 消息签名的服务端验签规则

`signMessage(message)` 使用当前活动账户，而非额外指定的地址。当前实现的精确步骤：

1. 格式化字符串：`'\x19Zent Signed Message:\n' + message.length + message`。
2. `message.length` 是 JavaScript UTF-16 code unit 长度，不是 UTF-8 字节数。
3. 对整个格式化字符串做 UTF-8 编码，再做一次 SHA-256。
4. 使用账户私钥做 secp256k1 签名，返回 `sig.toBytes()` 的 hex，
   即 64 字节紧凑 `r || s`，不包含恢复标记，不是交易签名使用的 DER 格式。

验签方必须使用相同前缀、长度规则和哈希。不能直接按 Ethereum `personal_sign` 验签。
返回值仅有签名，没有公钥和地址；若用于登录，服务端还需取得并验证签名公钥与目标地址的绑定。
当前没有专门的登录挑战或验签接口。

建议业务消息包含站点域名、用途、目标地址、随机 nonce、签发时间和过期时间；
服务端校验 nonce 一次性及有效期。签名时若当前账户变化，应废弃旧挑战重新开始。

## 10. 兼容说明

- 接入入口为 `window.zent` 的专用方法，当前没有公开 `request({ method, params })`、
  EVM `eth_*`、PSBT、Solana 交易或 WalletConnect 会话接口。
- 连接地址可能与活动账户不同，操作前按示例检查一致性；不要把 `getAccounts()` 全部地址视作本次授权。
- 当前 `disconnect()` 仅返回 `{ disconnected: true }`，应用必须自行清理连接状态。
  钱包当前未在这条 Provider 连接路径完整实现按站点持久化授权及隔离，页面本地连接状态不能代替钱包权限。
- `getNetwork().id` 为数字；网络映射键、切网返回 `networkId` 为字符串，两者不能直接比较。
  预期 `networkChanged` 载荷为网络配置键，但当前实现路径有差异，请重新读取网络。
- `chainId` 相同的主网和测试网不能通过 `switchNetwork(chainId)` 唯一选择；手动切换后重新连接。
- 所有金额目前以 `number` 返回，超出安全整数范围应停止构造交易，转为 `bigint` 无法补回已经丢失的精度。
- 没有专门的新增网络、费用估算、交易确认订阅、Provider 版本查询或通用交易构造接口。
