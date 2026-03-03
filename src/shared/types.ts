import { NetworkType } from './constants';

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
  value: number;
  rights: string[];
  confirmations: number;
  pkScript: string;
  myaddress: string;
  index: number;
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
  updated: number;
  id: number;
  explorerUrl?: string;
};

export type Utxo = {
  txid: string;
  address: string;
  value: number;
  tokenType: string;
  scriptPubKey: string;
  blockHeight: number;
  blockHash: string;
  rights: string[];
  index: number;
};

export type UtxoAddressSumInfo = {
  address: string;
  value: number;
  chainId: number;
  tokenType: string;
  blockHeight: number;
  blockHash: string;
};

export const CONAMES_DEFAULT_CHAIN_ID = 1;
export const CONAMES_DEFAULT_DECIMALPOINT = 0;
export type CoinNames = {
  name: string;
  chainId: number; // default: 1
  tokenType: string;
  iconHtml: string;
  decimalpoint: number; // default: '0'
  updated?: number;
  currency?: number;
};

export type transferAddressHistory = {
  address: string;
  updated?: number; // Defaults to 0 if not provided
};
