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
  pkScript: string;
  myaddress: string;
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

export type utxoType = {
  txid: string;
  address: string;
  value: string;
  tokenType: string;
  scriptPubKey: string;
  blockHeight: number;
  blockHash: string;
  rights: string[];
};

export type utxoAddressSumInfo = {
  address: string;
  value: number;
  chainId: number;
  tokenType: string;
  blockHeight: number;
  blockHash: string;
};

export const CONAMES_DEFAULT_CHAIN_ID = 1;
export const CONAMES_DEFAULT_DECIMALPOINT = 0;
export type conamesType = {
  name: string;
  chainId: number; // default: 1
  tokenType: string;
  html: string;
  decimalpoint: number; // default: '0'
  updated?: number;
  currency?:number;
};

 
  
  