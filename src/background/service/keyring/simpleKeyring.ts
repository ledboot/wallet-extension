import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256, sha256 } from '@noble/hashes/sha2';
import { getPublicKey, utils as secpUtils } from '@noble/secp256k1';
import bs58check from 'bs58check';

import { bytesToHex2, hexToBytes } from '@/background/utils';
import { BRAND_ALIAN_TYPE_TEXT, NetworkType } from '@/shared/constants';
import { Account } from '@/shared/types';
import preferenceService from '../preference';
import { MainnetPrivateKeyPrefix, MainnetAddressPrefix, TestnetPrivateKeyPrefix, TestnetAddressPrefix } from '@/shared/constants';

export const type = 'Simple Key Pair';

interface ECKey {
  privateKey: any;
  compressed: boolean;
  toWIF(): string;
  toHex(): string;
  getAddress(): string;
  getAddressHex(): string;
  getPubKeyHash(): Uint8Array;
  getPub(): Uint8Array;
}

export class ECKeyImpl implements ECKey {
  privateKey: any; // secpUtils.Bytes
  compressed: boolean;

  constructor(privateKey: any, compressed: boolean) {
    this.privateKey = privateKey;
    this.compressed = compressed;
  }


  toWIF(): string {
    const key = this.privateKey; // 32 bytes
    const payload = new Uint8Array(this.compressed ? 34 : 33);
    payload[0] = getPrivateKeyPrefix();
    payload.set(key, 1);
    if (this.compressed) payload[33] = 0x01;
    return bs58check.encode(Uint8Array.from(payload));
  }

  // Uint8Array to hex
  toHex(): string {
    return bytesToHex2(this.privateKey);
  }

  getAddress(): string {
    const pubHash = this.getPubKeyHash(); // 20 bytes
    const payload = new Uint8Array(21);
    payload[0] = getAddressPrefix();
    payload.set(pubHash, 1);
    return bs58check.encode(Uint8Array.from(payload));
  }

  getAddressHex(): string {
    const pubHash = this.getPubKeyHash();
    // const versionHex = bytesToHex2(new Uint8Array([getAddressPrefix()]));
    const hashHex = bytesToHex2(pubHash);
    return hashHex;
  }

  getPubKeyHash(): Uint8Array {
    const pubKey = this.getPub();
    return nobleRipemd160(nobleSha256(pubKey));
  }

  getPub(): Uint8Array {
    const pub = getPublicKey(this.privateKey, this.compressed);
    return pub;
  }
}

export class SimpleKeyring {
  type: string;
  key: string;
  wallets: ECKey[] = [];
  constructor() {
    this.key = '';
    this.type = type;
  }
  
  getIndexByAddress(address: string): number {
    return this.wallets.findIndex((wallet) => wallet.getAddress() === address);
  }

  activeAccount(index: number): Account {
    if (index < 0 || index >= this.wallets.length) {
      throw new Error('Invalid account index');
    }
    const wallet = this.wallets[index];
    return {
      type: this.type,
      pubkey: wallet.getAddress(),
      address: wallet.getAddress(),
      addressHex: wallet.getAddressHex(),
      index: index,
      key: this.type + "_" + wallet.getAddressHex(),
      flag: 0,
      alianName: `${BRAND_ALIAN_TYPE_TEXT[this.type]} ${index + 1}`,
    };
  }

  serialize(): any {
    // 返回[[hex,compressed],[hex,compressed]]
    return this.wallets.map((wallet) => [wallet.toHex(), wallet.compressed]);
  }

  async deserialize(opts: any):Promise<void> {
    const keyArray = opts as [string, boolean][][];
    console.log('deserialize keyArray', keyArray);
    // [['9d5799bd5449a8ee4eb5dbcddd5dd18a16f194fdef102a110867dd6773034feb', true], ['9d5799bd5449a8ee4eb5dbcddd5dd18a16f194fdef102a110867dd6773034feb', true]]
    
    for (const [hex, compressed] of keyArray) {
      console.log('deserialize hex', hex);
      console.log('deserialize compressed', compressed);
      const privateKeyBytes = hexToBytes(hex);
      this.wallets.push(new ECKeyImpl(privateKeyBytes, compressed));
    }
  }

  addAccounts(n = 1) {
    const newWallets: ECKey[] = [];
    const addressHexArray: string[] = [];
    for (let i = 0; i < n; i++) {
      const privateKey = secpUtils.randomPrivateKey();
      const eckey = new ECKeyImpl(privateKey, true);
      newWallets.push(eckey);
      addressHexArray.push(eckey.getAddressHex());
    }
    this.wallets = this.wallets.concat(newWallets);
    return addressHexArray;
  }

  getAccounts() {
    return this.wallets.map((wallet, index) => ({
      type: this.type,
      pubkey: wallet.getAddress(),
      address: wallet.getAddress(),
      addressHex: wallet.getAddressHex(),
      index: index,
      key: this.type + "_" + wallet.getAddressHex(),
      flag: 0,
      alianName: `${BRAND_ALIAN_TYPE_TEXT[this.type]} ${index + 1}`,
    }));
  }

  generatePrePrivateKey(): { address: string; wif: string} {
    const privateKey = secpUtils.randomPrivateKey();
    const eckey = new ECKeyImpl(privateKey, true);
    const preAddress = eckey.getAddress();
    const preWif = eckey.toWIF();
    return {
      address: preAddress,
      wif: preWif,
    };
  }

  exportAccount(address: string) {
    const wallet = this.getWalletForAccount(address);
    return wallet.toWIF();
  }

  exportPrivateKeyHex(address: string): string {
    const wallet = this.getWalletForAccount(address);
    console.log('exportPrivateKeyHex wallet pk', wallet.privateKey);
    return wallet.toHex();
  }

  exportPrivateKey(address: string): string {
    const wallet = this.getWalletForAccount(address);
    console.log('exportPrivateKeyHex wallet pk', wallet.privateKey);
    return wallet.privateKey;
  }

  removeAccount(publicKey: string) {
    const wallet = this.wallets.find(
      (eckey) => eckey.getAddress() === publicKey
    );
    if (wallet) {
      this.wallets = this.wallets.filter(
        (eckey) => eckey.privateKey !== wallet.privateKey
      );
    }
  }

  getWalletForAccount(address: string) {
    const wallet = this.wallets.find((eckey) => eckey.getAddress() === address);
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching publicKey.');
    }
    return wallet;
  }
}

export function getPrivateKeyPrefix(): number {
  return preferenceService.getNetworkType() === NetworkType.MAINNET ? MainnetPrivateKeyPrefix : TestnetPrivateKeyPrefix;
}

export function getAddressPrefix(): number {
  return preferenceService.getNetworkType() === NetworkType.MAINNET ? MainnetAddressPrefix : TestnetAddressPrefix;
}

export function decodeWalletImportFormat(wif: string): { privateKeyHex: string; compressed: boolean } {
  const decoded = bs58check.decode(wif); // version + key [+ 0x01]
  
  const compressed = isCompressedWalletImportFormat(wif);
  // if (!verifyWalletImportFormat(wif, compressed)) {
  //   throw new Error('Invalid private key format!');
  // }

  // 根据网络类型检查前缀
  const expectedPrefix = getPrivateKeyPrefix();
  
  if (decoded[0] !== expectedPrefix) {
    throw new Error('Version not supported!');
  }
  
  const priv = decoded.slice(1, 33);
  const privateKeyHex = bytesToHex2(priv);
  return { privateKeyHex, compressed };
};

export function isCompressedWalletImportFormat(wif: string): boolean {
  if (preferenceService.getNetworkType() === NetworkType.MAINNET ){
    return /^[LK][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$/.test(wif);
  }else{
    return /^c[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$/.test(wif);
  }
}

export function verifyWalletImportFormat(wif: string, compressed: boolean): boolean {
  const decoded = bs58check.decode(wif);
  let hash: Uint8Array;
  if (compressed) {
    hash = decoded.slice(0, 34);
  }else{
    hash = decoded.slice(0, 33);
  }
  const checksum = sha256(sha256(hash));
  if (compressed) {
    if (checksum[0] !== decoded[34] || checksum[1] !== decoded[35] || checksum[2] !== decoded[36] || checksum[3] !== decoded[37]) {
      return false;
    }
  }else{
    if (checksum[0] !== decoded[33] || checksum[1] !== decoded[34] || checksum[2] !== decoded[35] || checksum[3] !== decoded[36]) {
      return false;
    }
  }
  return true;
}