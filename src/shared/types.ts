export enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

export interface AnexBalance {
  confirm_amount: string;
  pending_amount: string;
  amount: string;
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
  confirmations: number;
  height: number;
  timestamp: number;
  size: number;
  feeRate: number;
  fee: number;
  outputValue: number;
  vin: TxHistoryInOutItem[];
  vout: TxHistoryInOutItem[];
  types: string[];
  methods: string[];
}

export type WalletKeyring = {
  key: string;
  index: number;
  type: string;
  accounts: Account[];
  alianName: string;
};
