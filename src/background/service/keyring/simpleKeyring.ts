import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';
import { getPublicKey, utils as secpUtils } from '@noble/secp256k1';
import bs58check from 'bs58check';

import { bytesToHex2 } from '@/background/utils';
import { BRAND_ALIAN_TYPE_TEXT, NetworkType } from '@/shared/constants';
import { Account } from '@/shared/types';
import preferenceService from '../preference';

export const type = 'Simple Key Pair';

const mainnetPrivateKeyPrefix = 0x80;
const mainnetAddressPrefix = 0;
const testnetPrivateKeyPrefix = 0xEF;
const testnetAddressPrefix = 0x6F;

interface ECKey {
  privateKey: any;
  compressed: boolean;
  toWIF(): string;
  getAddress(): string;
  getAddressHex(): string;
  getPubKeyHash(): Uint8Array;
  getPub(): Uint8Array;
}

class ECKeyImpl implements ECKey {
  privateKey: any;
  compressed: boolean;

  constructor(privateKey: any, compressed: boolean) {
    this.privateKey = privateKey;
    this.compressed = compressed;
  }

  getPrivateKeyPrefix(): number {
    return preferenceService.getNetworkType() === NetworkType.MAINNET ? mainnetPrivateKeyPrefix : testnetPrivateKeyPrefix;
  }

  getAddressPrefix(): number {
    return preferenceService.getNetworkType() === NetworkType.MAINNET ? mainnetAddressPrefix : testnetAddressPrefix;
  }

  toWIF(): string {
    const key = this.privateKey; // 32 bytes
    const payload = new Uint8Array(this.compressed ? 34 : 33);
    payload[0] = this.getPrivateKeyPrefix();
    payload.set(key, 1);
    if (this.compressed) payload[33] = 0x01;
    return bs58check.encode(Uint8Array.from(payload));
  }

  toByteArray(): any | null {
    return Array.from(this.privateKey);
  }

  getAddress(): string {
    const pubHash = this.getPubKeyHash(); // 20 bytes
    const payload = new Uint8Array(21);
    payload[0] = this.getAddressPrefix();
    payload.set(pubHash, 1);
    return bs58check.encode(Uint8Array.from(payload));
  }

  getAddressHex(): string {
    const pubHash = this.getPubKeyHash();
    const versionHex = bytesToHex2(new Uint8Array([this.getAddressPrefix()]));
    const hashHex = bytesToHex2(pubHash);
    return versionHex + hashHex;
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
  constructor(opts?: any) {
    if (opts) {
      this.deserialize(opts);
    }
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
    return this.wallets.map((wallet) => wallet.toWIF());
  }

  deserialize(opts: any) {
    const wifArray = opts as string[];
    for (const wif of wifArray) {
      const { privateKeyBytes, compressed } = this.decodeWalletImportFormat(wif);
      if (privateKeyBytes == null || privateKeyBytes.length != 32) {
        // return Promise.reject(new Error('invalid private key'));
        throw new Error('invalid private key');
      }
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

  generatePrePrivateKey() {
    const privateKey = secpUtils.randomPrivateKey();
    const eckey = new ECKeyImpl(privateKey, true);
    const address = eckey.getAddress();
    const wif = eckey.toWIF();
    return {
      address,
      wif,
    };
  }

  exportAccount(address: string) {
    const wallet = this.getWalletForAccount(address);
    return wallet.toWIF();
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

  getPrivateKeyPrefix(): number {
    return preferenceService.getNetworkType() === NetworkType.MAINNET ? mainnetPrivateKeyPrefix : testnetPrivateKeyPrefix;
  }

  decodeWalletImportFormat = (wif: string): { privateKeyBytes: Uint8Array; compressed: boolean } => {
    const decoded = bs58check.decode(wif); // version + key [+ 0x01]
    
    // 根据网络类型检查前缀
    const expectedPrefix = this.getPrivateKeyPrefix();
    
    if (decoded[0] !== expectedPrefix) {
      throw new Error(
        `Private key format mismatch!`
      );
    }
    
    const compressed = decoded.length === 34 && decoded[33] === 0x01;
    const priv = decoded.slice(1, 33);
    return { privateKeyBytes: priv, compressed };
  };

}
