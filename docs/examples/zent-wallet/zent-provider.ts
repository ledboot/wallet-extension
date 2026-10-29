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
