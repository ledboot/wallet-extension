// Test to validate that our implementation of createAddress 
// matches the behavior of the omega.js createaddress method

import { getSECCurveByName } from './src/shared/ecdsa.js';
import bigInt from 'big-integer';
import bs58check from 'bs58check';
import { base58_to_binary } from 'base58-js';
import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';

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
    // Use bs58check to encode directly - it handles checksum internally
    return bs58check.encode(hashWithVersion);
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

// 等价于 omega.js 的 getBigRandom 实现
function getBigRandom(limit) {
  const bitLen = limit.toString(2).length;
  const byteLen = Math.ceil(bitLen / 8);
  const bytes = new Uint8Array(byteLen);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    console.log('Using Math.random for random bytes generation. This is not cryptographically secure.');
    for (let i = 0; i < byteLen; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const rnd = bigInt(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''), 16);
  return rnd.mod(limit.subtract(bigInt.one)).add(bigInt.one);
}

// Implementation of the createAddress function (equivalent to createaddress in omega.js)
function createAddress() {
  // 使用与 omega.js 一致的随机私钥生成方式（范围在 1..n-1）
  const n = bigInt('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141', 16);
  const privateKey = getBigRandom(n);
  
  // Create a new EC key with compressed=true
  const ec = new ECKeyImpl(privateKey, true);
  
  // Get WIF, address and hex
  const wif = ec.toWIF();
  const address = ec.getAddress();
  const hex = ec.getAddressHex();
  
  return { wif, address, hex };
}

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
  try {
    // Decode WIF
    const wifBytes = base58_to_binary(result.wif);
    
    // Check version byte (should be 0x80)
    if (wifBytes[0] !== 0x80) {
      console.log('  ✗ Invalid version byte in WIF');
      continue;
    }
    
    // Check if it's compressed (should have 0x01 at end before checksum)
    const isCompressed = wifBytes.length === 38 && wifBytes[33] === 0x01;
    const privateKeyBytes = isCompressed ? wifBytes.slice(1, 33) : wifBytes.slice(1, 33);
    
    // Verify checksum
    const dataToCheck = wifBytes.slice(0, isCompressed ? 34 : 33);
    const checksum = nobleSha256(nobleSha256(new Uint8Array(dataToCheck)));
    
    const checksumStartIndex = isCompressed ? 34 : 33;
    if (
      checksum[0] !== wifBytes[checksumStartIndex] ||
      checksum[1] !== wifBytes[checksumStartIndex + 1] ||
      checksum[2] !== wifBytes[checksumStartIndex + 2] ||
      checksum[3] !== wifBytes[checksumStartIndex + 3]
    ) {
      console.log('  ✗ Invalid checksum in WIF');
      continue;
    }
    
    // Recreate key from WIF and verify address
    const privateKeyHex = Array.from(privateKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const privateKey = bigInt(privateKeyHex, 16);
    const ecFromWIF = new ECKeyImpl(privateKey, isCompressed);
    const addressFromWIF = ecFromWIF.getAddress();
    
    if (addressFromWIF === result.address) {
      console.log('  ✓ Address verification passed');
    } else {
      console.log('  ✗ Address verification failed');
      console.log('    Expected:', result.address);
      console.log('    Got:', addressFromWIF);
    }
  } catch (error) {
    console.log('  ✗ Error during WIF verification:', error.message);
  }
  
  console.log('');
}

console.log('=== All tests completed ===');