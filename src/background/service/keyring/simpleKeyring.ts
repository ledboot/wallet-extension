import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';
import { base58_to_binary } from 'base58-js';
import bigInt from 'big-integer';
import bs58check from 'bs58check';
import { EventEmitter } from 'eventemitter3';

import { getSECCurveByName } from '@/shared/ecdsa.js';

const type = 'Simple Key Pair';

interface ECKey {
  privateKey: bigInt.BigInteger;
  compressed: boolean;
  toWIF(): string;
  getAddress(): string;
  getAddressHex(): string;
  getPubKeyHash(): Uint8Array;
  getPub(): Uint8Array;
}

class ECKeyImpl implements ECKey {
  // ECKey.privateKeyPrefix = 0x80; // mainnet 0x80    testnet 0xEF
  // ECKey.addressPrefix = 0; // mainnet 0x0    testnet 0x6F

  privateKey: bigInt.BigInteger;
  compressed: boolean;
  // pubPoint:bigInt.BigInteger;

  constructor(privateKey: bigInt.BigInteger, compressed: boolean) {
    this.privateKey = privateKey;
    this.compressed = compressed;
  }

  toWIF(): string {
    const bytes = this.toByteArray();
    if (bytes == null) return '';

    // Add version byte (0x80 for mainnet)
    const bytesArray = [0x80, ...bytes, ...(this.compressed ? [0x01] : [])];

    return bs58check.encode(new Uint8Array(bytesArray));
  }

  toByteArray(): Uint8Array | null {
    if (this.privateKey == null) return null;

    // Get a copy of private key as a byte array
    const bytes = this.privateKey.toArray(256).value;

    // zero pad if private key is less than 32 bytes
    while (bytes.length < 32) bytes.unshift(0x00);

    return new Uint8Array(bytes);
  }

  getAddress(): string {
    const pubHash = this.getPubKeyHash();
    // 创建包含版本字节的数组
    const hashWithVersion = new Uint8Array([0x00, ...pubHash]);
    // 直接使用 bs58check 来计算校验和并编码
    return bs58check.encode(hashWithVersion);
  }

  getAddressHex(): string {
    const pubHash = this.getPubKeyHash();
    const version = 0x00; // mainnet address version

    // Convert version and hash to hex strings (reverse of hexToBytes)
    const versionHex = Array.from([version])
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const hashHex = Array.from(pubHash)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return versionHex + hashHex;
  }

  getPubKeyHash(): Uint8Array {
    const pubKey = this.getPub();
    return nobleRipemd160(nobleSha256(pubKey));
  }

  getPub(): Uint8Array {
    const secp256k1 = getSECCurveByName('secp256k1');
    const pubPoint = secp256k1.getG().multiply(this.privateKey);
    if (this.compressed) {
      return new Uint8Array(pubPoint.getEncoded(1));
    } else {
      return new Uint8Array(pubPoint.getEncoded(0));
    }
  }
}

export class SimpleKeyring extends EventEmitter {
  static type = type;
  type = type;
  wallets: ECKey[] = [];
  privateKeyPrefix = 0x80; // mainnet 0x80    testnet 0xEF
  addressPrefix = 0; // mainnet 0x0    testnet 0x6F
  // private bitcoinCore: any;
  constructor(opts?: any) {
    super();
    if (opts) {
      this.deserialize(opts);
    }
  }

  /**
   * 初始化 Bitcoin 核心库
   */
  // private async ensureBitcoinCore() {
  //   if (!this.bitcoinCore) {
  //     this.bitcoinCore = await loadBitcoinCore();
  //   }
  //   return this.bitcoinCore;
  // }

  async serialize(): Promise<any> {
    return this.wallets.map((wallet) => wallet.toWIF());
  }

  async deserialize(opts: any) {
    // const { ECPair } = await this.ensureBitcoinCore();
    console.log('opts', opts);
    const privateKeyArray = opts as string[];
    for (const privateKey of privateKeyArray) {
      let compressed = false;
      let privateKeyBytes: Uint8Array;
      if (this._isWalletImportFormat(privateKey)) {
        privateKeyBytes = this._decodeWalletImportFormat(privateKey);
      } else if (this._isCompressedWalletImportFormat(privateKey)) {
        compressed = true;
        privateKeyBytes = this._decodeCompressedWalletImportFormat(privateKey);
      } else {
        throw new Error('invalid private key');
      }
      if (privateKeyBytes == null || privateKeyBytes.length != 32) {
        throw new Error('invalid private key');
      }
      // 将 Uint8Array 转换为十六进制字符串，然后创建 BigInteger
      const privateKeyHex = Array.from(privateKeyBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const privateKeyBigInt = bigInt(privateKeyHex, 16);
      this.wallets.push(new ECKeyImpl(privateKeyBigInt, compressed));
    }
  }

  async addAccounts(n = 1) {
    // const { ECPair } = await this.ensureBitcoinCore();
    const newWallets: ECKey[] = [];
    const addressHexArray: string[] = [];
    for (let i = 0; i < n; i++) {
      const privateKeyBigInt = this.generatePrivateKey();
      // const privateKeyBytes = this.getPrivateKeyByteArray(privateKeyBigInt);

      if (privateKeyBigInt) {
        const eckey = new ECKeyImpl(privateKeyBigInt, true);
        newWallets.push(eckey);
        addressHexArray.push(eckey.getAddressHex());
      }
    }
    this.wallets = this.wallets.concat(newWallets);
    return addressHexArray;
  }

  async getAccounts() {
    return this.wallets.map((wallet) => wallet.getAddress());
  }

  private generatePrivateKey() {
    // const secp256k1 = getSECCurveByName('secp256k1');
    const n = bigInt(
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141',
      16
    );
    const privateKey = this.getBigRandom(n);
    return privateKey;
  }

  private getBigRandom(limit: bigInt.BigInteger) {
    const bitLen = limit.toString(2).length;
    const byteLen = Math.ceil(bitLen / 8);
    const bytes = new Uint8Array(byteLen);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < byteLen; i++)
        bytes[i] = Math.floor(Math.random() * 256);
    }
    const rnd = bigInt(
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
      16
    );
    return rnd.mod(limit.subtract(bigInt.one)).add(bigInt.one);
  }

  generatePrePrivateKey() {
    console.log('generatePrePrivateKey');
    const privateKey = this.generatePrivateKey();
    const eckey = new ECKeyImpl(privateKey, true);
    const address = eckey.getAddress();
    const wif = eckey.toWIF();
    console.log('generatePrePrivateKey', address, wif);
    return {
      address,
      wif,
    };
  }

  async exportAccount(address: string) {
    const wallet = this._getWalletForAccount(address);
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

  private _getWalletForAccount(address: string) {
    const wallet = this.wallets.find((eckey) => eckey.getAddress() === address);
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching publicKey.');
    }
    return wallet;
  }

  _isWalletImportFormat = (privateKey: string) => {
    return /^5[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{50}$/.test(
      privateKey
    );
  };

  _isCompressedWalletImportFormat = (privateKey: string) => {
    return /^[LK][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$/.test(
      privateKey
    );
  };

  _decodeWalletImportFormat = (privateKey: string) => {
    const bytes = base58_to_binary(privateKey);
    const hash = bytes.slice(0, 33);
    const checksum = nobleSha256(nobleSha256(new Uint8Array(hash)));
    if (
      checksum[0] != bytes[33] ||
      checksum[1] != bytes[34] ||
      checksum[2] != bytes[35] ||
      checksum[3] != bytes[36]
    ) {
      throw 'Checksum validation failed!';
    }
    const version = hash[0];
    if (version != 0x80) {
      throw 'Version ' + version + ' not supported!';
    }
    // 移除版本字节，返回纯私钥数据
    const privateKeyBytes = hash.slice(1); // 跳过版本字节(1字节)
    return privateKeyBytes;
  };

  _decodeCompressedWalletImportFormat = (privateKey: string) => {
    const bytes = base58_to_binary(privateKey);
    const hash = bytes.slice(0, 34);
    const checksum = nobleSha256(nobleSha256(new Uint8Array(hash)));
    if (
      checksum[0] != bytes[34] ||
      checksum[1] != bytes[35] ||
      checksum[2] != bytes[36] ||
      checksum[3] != bytes[37]
    ) {
      throw 'Checksum validation failed!';
    }
    const version = hash[0];
    if (version != 0x80) {
      throw 'Version ' + version + ' not supported!';
    }
    // 移除版本字节和压缩标志字节，返回纯私钥数据
    const privateKeyBytes = hash.slice(1, 33); // 跳过版本字节(1字节)和压缩标志字节(1字节)
    return privateKeyBytes;
  };
}
