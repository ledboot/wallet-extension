// Traditional Bitcoin P2PKH implementation using open-source libraries
import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';
import { getPublicKey, utils as secpUtils } from '@noble/secp256k1';
import bs58check from 'bs58check';

export class ECKeyImpl {
  privateKeyPrefix = 0x80; // mainnet 0x80    testnet 0xEF
  addressPrefix = 0; // mainnet 0x0    testnet 0x6F
  privateKey; // Uint8Array(32)
  compressed;

  constructor(privateKey, compressed) {
    this.privateKey = privateKey;
    this.compressed = compressed;
  }

  getPub() {
    const pub = getPublicKey(this.privateKey, this.compressed);
    return pub;
  }

  getPubKeyHash() {
    const pubKey = this.getPub();
    return nobleRipemd160(nobleSha256(pubKey));
  }

  toWIF() {
    const key = this.privateKey; // 32 bytes
    const payload = new Uint8Array(this.compressed ? 34 : 33);
    payload[0] = this.privateKeyPrefix;
    payload.set(key, 1);
    if (this.compressed) payload[33] = 0x01;
    return bs58check.encode(Uint8Array.from(payload));
  }

  toByteArray() {
    return Array.from(this.privateKey);
  }

  getAddress() {
    const pubHash = this.getPubKeyHash(); // 20 bytes
    const payload = new Uint8Array(21);
    payload[0] = this.addressPrefix;
    payload.set(pubHash, 1);
    return bs58check.encode(Uint8Array.from(payload));
  }

  getAddressHex() {
    const pubHash = this.getPubKeyHash();
    const versionHex = bytesToHex2(new Uint8Array([this.addressPrefix]));
    const hashHex = bytesToHex2(pubHash);
    return versionHex + hashHex;
  }
}

function bytesToHex2(bytes) {
  const hex = [];
  for (let i = 0; i < bytes.length; i++) {
    hex.push((bytes[i] >>> 4).toString(16));
    hex.push((bytes[i] & 0xf).toString(16));
  }
  return hex.join('');
}

function decodeCompressedWalletImportFormat(wif) {
  const decoded = bs58check.decode(wif); // version + key [+ 0x01]
  if (decoded[0] !== 0x80) throw 'Version ' + decoded[0] + ' not supported!';
  const compressed = decoded.length === 34 && decoded[33] === 0x01;
  const priv = decoded.slice(1, 33);
  return { privateKeyBytes: priv, compressed };
}

// Secure private key generation (1..n-1)
function randomPrivateKey() {
  return secpUtils.randomPrivateKey(); // Uint8Array(32)
}

// Create address using random private key (compressed)
function createAddress() {
  const privateKey = randomPrivateKey();
  const ec = new ECKeyImpl(privateKey, true);
  const wif = ec.toWIF();
  const address = ec.getAddress();
  const hex = ec.getAddressHex();
  return { wif, address, hex };
}

function decodeWIF(wif) {
  const { privateKeyBytes, compressed } =
    decodeCompressedWalletImportFormat(wif);
  const ec = new ECKeyImpl(privateKeyBytes, compressed);
  const address = ec.getAddress();
  const addrHex = ec.getAddressHex();
  console.log('address:', address);
  console.log('addrHex:', addrHex);
  ec.toWIF();
}

function testGetAddress() {
  // Test the createAddress function
  console.log('=== Testing createAddress function ===');
  // Run multiple tests to verify consistency
  for (let i = 0; i < 5; i++) {
    const result = createAddress();
    console.log(`Test ${i + 1}:`);
    console.log('  WIF:', result.wif);
    console.log('  Address:', result.address);
    console.log('  Hex:', result.hex);

    // Verify the WIF can be decoded back to the same key
    // Decode WIF
    const wifBytes = bs58check.decode(result.wif);

    // Check version byte (should be 0x80)
    if (wifBytes[0] !== 0x80) {
      console.log('  ✗ Invalid version byte in WIF');
      continue;
    }

    // Check if it's compressed (should have 0x01 at end before checksum)
    const isCompressed = wifBytes.length === 34 && wifBytes[33] === 0x01;
    const privateKeyBytes = isCompressed
      ? wifBytes.slice(1, 33)
      : wifBytes.slice(1, 32);

    const ecFromWIF = new ECKeyImpl(privateKeyBytes, isCompressed);
    const addressFromWIF = ecFromWIF.getAddress();

    if (addressFromWIF === result.address) {
      console.log('  ✓ Address verification passed');
    } else {
      console.log('  ✗ Address verification failed');
      console.log('    Expected:', result.address);
      console.log('    Got:', addressFromWIF);
    }
  }
}

// const result = createAddress();
// 触发一次地址创建，避免未使用函数警告
// const created = createAddress();
// console.log('generated:', created.wif, created.address, created.hex);

const wif = '';
decodeWIF(wif);

// testGetAddress();
