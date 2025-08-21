// 测试 SimpleKeyring 的 getPubKeyHash 方法
// 运行方式: node test-keyring.js

import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256, } from '@noble/hashes/sha2';
import bigInt from 'big-integer';
import bs58check from 'bs58check';
import { getSECCurveByName } from './src/shared/ecdsa.js';
import { base58_to_binary } from 'base58-js';

class ECKeyImpl {
  privateKey;
  compressed;

  constructor(privateKey, compressed) {
    this.privateKey = privateKey;
    this.compressed = compressed;
  }

  getPub() {
    const secp256k1 = getSECCurveByName('secp256k1');
    const pubPoint = secp256k1.getG().multiply(this.privateKey);
    if (this.compressed) {
      return new Uint8Array(pubPoint.getEncoded(1));
    } else {
      return new Uint8Array(pubPoint.getEncoded(0));
    }
  }

  getPubKeyHash() {
    const pubKey = this.getPub();
    
    return nobleRipemd160(nobleSha256(pubKey));
  }

  toWIF() {
    const bytes = this.toByteArray();
    if (bytes == null) return '';

    // Add version byte (0x80 for mainnet)
    let bytesArray = [0x80, ...bytes];

    // Add compression flag if compressed
    if (this.compressed) {
      bytesArray.push(0x01);
    }

    // Use bs58check to encode directly - it handles checksum internally
    return bs58check.encode(new Uint8Array(bytesArray));
  }

  toByteArray() {
    if (this.privateKey == null) return null;

    const bytes = this.privateKey.toArray(256).value;
    while (bytes.length < 32) bytes.unshift(0x00);

    return new Uint8Array(bytes);
  }

  getAddress() {
    const pubHash = this.getPubKeyHash();
    // Create array with version byte
    const hashWithVersion = new Uint8Array([0x00, ...pubHash]);
    const checksum = nobleSha256(nobleSha256(hashWithVersion));
    const bytes = new Uint8Array([...hashWithVersion, ...checksum.slice(0, 4)]);
    // Use bs58check to encode directly - it handles checksum internally
    return bs58check.encode(bytes);
  }

  getAddressHex() {
    const pubHash = this.getPubKeyHash();
    const version = 0x00;

    const versionHex = Array.from([version])
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const hashHex = Array.from(pubHash)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return versionHex + hashHex;
  }
}

// Implementation of the createAddress function (equivalent to createaddress in omega.js)
function createAddress() {
  // Generate a random private key (32 bytes)
  const privateKeyBytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use crypto.getRandomValues if available (browser/Node.js)
    crypto.getRandomValues(privateKeyBytes);
  } else {
    // Fallback to Math.random (not cryptographically secure, but okay for testing)
    for (let i = 0; i < 32; i++) {
      privateKeyBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to bigInt
  const privateKeyHex = Array.from(privateKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const privateKey = bigInt(privateKeyHex, 16);
  
  // Create a new EC key with compressed=true
  const ec = new ECKeyImpl(privateKey, true);
  
  // Get WIF, address and hex
  const wif = ec.toWIF();
  const address = ec.getAddress();
  const hex = ec.getAddressHex();
  
  return { wif, address, hex };
}

function testImportWIF() {
  console.log('=== 测试导入 WIF ===');
  const wif = "KxrJshAP4qQh1bhPvwZEbVDyhPjVEBaZNeSX1T7u5i9cNXUwoWzi"
  
  console.log('输入 WIF:', wif);
  
  // KxUWZJcnbjkT41sQA2VDKA9wCCZyXZdTETomr33B4xknshossVyT
  let privateKeyBytes = null;
  let compressed = false;
  if (_isWalletImportFormat(wif)) {
    console.log('检测到非压缩 WIF 格式');
    privateKeyBytes = _decodeWalletImportFormat(wif);
  }else if (_isCompressedWalletImportFormat(wif)) {
    console.log('检测到压缩 WIF 格式');
    compressed = true;
    privateKeyBytes = _decodeCompressedWalletImportFormat(wif);
  }else{
    throw new Error('invalid private key');
  }
  
  console.log('privateKeyBytes length:', privateKeyBytes.length);
  console.log('privateKeyBytes:', Array.from(privateKeyBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  console.log('compressed:', compressed);

  /**
   * WIF: KxrJshAP4qQh1bhPvwZEbVDyhPjVEBaZNeSX1T7u5i9cNXUwoWzi
   * Address: 1LYLCuvWeXws25Vbi7d5TpGhTcX2nhCXHXxAQbJ
   * Hex: 0020c16ed15c31bf6a91ab019949a8479b3e70d022
   */

  if (privateKeyBytes == null || privateKeyBytes.length != 32) {
    throw new Error('invalid private key');
  }
  
  // 将 Uint8Array 转换为十六进制字符串，然后创建 BigInteger
  const privateKeyHex = Array.from(privateKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const privateKeyBigInt = bigInt(privateKeyHex, 16);
  console.log('privateKeyBigInt:', privateKeyBigInt.toString());
  
  const eckey = new ECKeyImpl(privateKeyBigInt, compressed);
  
  // 调试公钥生成
  const pubKey = eckey.getPub();
  console.log('pubKey length:', pubKey.length);
  console.log('pubKey:', Array.from(pubKey).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  // 调试公钥哈希
  const pubKeyHash = eckey.getPubKeyHash();
  console.log('pubKeyHash length:', pubKeyHash.length);
  console.log('pubKeyHash:', Array.from(pubKeyHash).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  console.log('address:', eckey.getAddress());
  console.log('期望地址: 1ESopUwuz1xEQ2u4C9nfhFAqAaqj6LNspP');
  console.log('addressHex:', eckey.getAddressHex());
  console.log('wif:', eckey.toWIF());
  
  // Verification: Check that the decoded private key matches expected value
  const expectedPrivateKeyHex = "25736a3828e50ebca0ac02b92121d2d41dbcfb79ad7ee766677a8d70fb0e9b2f";
  if (privateKeyHex === expectedPrivateKeyHex) {
    console.log('✓ Private key decoding is correct');
  } else {
    console.log('✗ Private key decoding failed. Expected:', expectedPrivateKeyHex);
  }
}

function _isWalletImportFormat(privateKey) {
  return /^5[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{50}$/.test(privateKey);
};

function _isCompressedWalletImportFormat(privateKey) {
  return /^[LK][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$/.test(privateKey);
};

function _decodeWalletImportFormat(privateKey) {
  const bytes = base58_to_binary(privateKey);
  const hash = bytes.slice(0, 33);
  const checksum = nobleSha256(nobleSha256(new Uint8Array(hash)));
  
  // Verify checksum (4 bytes at the end)
  if (checksum[0] != bytes[33] ||
        checksum[1] != bytes[34] ||
        checksum[2] != bytes[35] ||
        checksum[3] != bytes[36]) {
    throw 'Checksum validation failed!';
  }
  
  // Check version byte (first byte should be 0x80 for mainnet)
  const version = hash[0];
  if (version != 0x80) {
    throw 'Version ' + version + ' not supported!';
  }
  
  // Remove version byte, return pure private key data
  const privateKeyBytes = hash.slice(1); // Skip version byte(1 byte)
  return privateKeyBytes;
};

function _decodeCompressedWalletImportFormat(privateKey) {
  const bytes = base58_to_binary(privateKey);
  const hash = bytes.slice(0, 34);
  const checksum = nobleSha256(nobleSha256(new Uint8Array(hash)));
  
  // Verify checksum (4 bytes at the end)
  if (checksum[0] != bytes[34] ||
        checksum[1] != bytes[35] ||
        checksum[2] != bytes[36] ||
        checksum[3] != bytes[37]) {
    throw "Checksum validation failed!";
  }
  
  // Check version byte (first byte should be 0x80 for mainnet)
  const version = hash[0];
  if (version != 0x80) {
    throw 'Version ' + version + ' not supported!';
  }
  
  // Remove version byte (first byte) and compression flag byte (last byte of hash)
  // Return the 32-byte private key
  const privateKeyBytes = hash.slice(1, 33);
  return privateKeyBytes;
};;

// Test the createAddress function
function testCreateAddress() {
  console.log('=== 测试创建地址 ===');
  const result = createAddress();
  console.log('WIF:', result.wif);
  console.log('Address:', result.address);
  console.log('Hex:', result.hex);
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  // testKeyring();
  // testKnownPrivateKey();
  testImportWIF();
  testCreateAddress();
}

export { ECKeyImpl, testImportWIF };
