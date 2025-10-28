import { NetworkType } from "./constants";
export interface AnexBalance {
  amount: bigint;
}

export interface Account {
  type: string;
  pubkey: string;
  address: string;
  addressHex: string;
  alianName?: string;
  index?: number;
  balance?: number;
  key: string;
  flag: number;
}

export interface WalletConfig {
  version: string;
  endpoint: string;
}

export interface AddressSummary {
  address: string;
  totalSatoshis: number;
  btcSatoshis: number;
  assetSatoshis: number;
  loading?: boolean;
}

export interface TxHistoryInOutItem {
  address: string;
  value: number;
}

export interface TxHistoryItem {
  txid: string;
  address: string;
  txType: TxType;
  blockHeight: number;
  blockHash: string;
  blockTime: number;
  tokenType: string;
  value: string;
  rights: string[];
  confirmations: number;
}

export enum TxType {
  SEND = 'SEND',
  RECEIVE = 'RECEIVE',
}

export type WalletKeyring = {
  key: string;
  index: number;
  type: string;
  accounts: Account[];
  alianName: string;
};

export type ChainInfo = {
  label: string;
  iconLabel: string;
  chainId: number;
  endpoints: string[];
  icon: string;
  unit: string;
  networkType: NetworkType;
};