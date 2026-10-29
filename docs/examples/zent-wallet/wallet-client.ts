import type { CurrentNetwork, ZentProvider } from './zent-provider';

export interface WalletSession {
  address: string;
  network: CurrentNetwork;
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return typeof error === 'string' ? error : '钱包请求失败';
}

export async function detectZent(timeoutMs = 1500): Promise<ZentProvider | null> {
  if (typeof window === 'undefined') return null;
  if (window.zent) return window.zent;
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (): void => {
      window.removeEventListener('zent#initialized', finish);
      if (timer !== undefined) clearTimeout(timer);
      resolve(window.zent ?? null);
    };
    window.addEventListener('zent#initialized', finish, { once: true });
    timer = setTimeout(finish, timeoutMs);
    if (window.zent) finish();
  });
}

export function isSameNetwork(left: CurrentNetwork, right: CurrentNetwork): boolean {
  return left.id === right.id && left.chainId === right.chainId && left.rpcUrl === right.rpcUrl;
}

export async function connectWallet(zent: ZentProvider): Promise<WalletSession> {
  const accounts = await zent.requestAccounts();
  const current = await zent.getCurrentAccount();
  if (!accounts[0] || accounts[0] !== current?.address) {
    throw new Error('请在钱包内切换到连接时选择的账户，然后重新连接');
  }
  return { address: accounts[0], network: await zent.getNetwork() };
}

// session 是连接时记录的上下文；不要在签名前用新状态覆盖旧 session。
export async function assertWalletContext(zent: ZentProvider, session: WalletSession): Promise<void> {
  const [account, network] = await Promise.all([zent.getCurrentAccount(), zent.getNetwork()]);
  if (account?.address !== session.address || !isSameNetwork(network, session.network)) {
    throw new Error('账户或网络已变化，请重新连接并重新构造交易');
  }
}

export async function signRawTransaction(
  zent: ZentProvider,
  session: WalletSession,
  rawTxHex: string
): Promise<string> {
  if (!/^(?:[0-9a-fA-F]{2})+$/.test(rawTxHex)) {
    throw new Error('请输入完整交易 hex，不含 0x 前缀');
  }
  await assertWalletContext(zent, session);
  const { signedTransaction } = await zent.signTransaction(rawTxHex);
  await assertWalletContext(zent, session);
  return signedTransaction;
}

export async function broadcastSignedTransaction(
  zent: ZentProvider,
  session: WalletSession,
  signedTxHex: string
): Promise<string> {
  if (!/^(?:[0-9a-fA-F]{2})+$/.test(signedTxHex)) {
    throw new Error('请输入完整已签名交易 hex，不含 0x 前缀');
  }
  await assertWalletContext(zent, session);
  const { txHash } = await zent.sendTransaction(signedTxHex);
  return txHash;
}
