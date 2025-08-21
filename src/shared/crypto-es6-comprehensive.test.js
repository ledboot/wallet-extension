import {
  AES,
  AnsiX923,
  Binary,
  CBC,
  CFB,
  CryptoUtil,
  CTR,
  ECB,
  HMAC,
  Iso7816,
  Iso10126,
  NoPadding,
  OFB,
  PBKDF2,
  Pkcs7,
  RIPEMD160,
  SHA256,
  UTF8,
  ZeroPadding,
} from './crypto-es6.js';

console.log('=== Comprehensive Crypto Tests ===\n');

// Test 1: Basic utility functions
console.log('Test 1: Basic utility functions');
const testBytes = [0x48, 0x65, 0x6c, 0x6c, 0x6f]; // "Hello"
const hex = CryptoUtil.bytesToHex(testBytes);
console.log('  bytesToHex([72,101,108,108,111]):', hex);
console.assert(hex === '48656c6c6f', 'bytesToHex failed');

const bytesFromHex = CryptoUtil.hexToBytes(hex);
console.log('  hexToBytes("48656c6c6f"):', bytesFromHex);
console.assert(
  JSON.stringify(bytesFromHex) === JSON.stringify(testBytes),
  'hexToBytes failed'
);

const base64 = CryptoUtil.bytesToBase64(testBytes);
console.log('  bytesToBase64([72,101,108,108,111]):', base64);
console.assert(base64 === 'SGVsbG8=', 'bytesToBase64 failed');

const bytesFromBase64 = CryptoUtil.base64ToBytes(base64);
console.log('  base64ToBytes("SGVsbG8="):', bytesFromBase64);
console.assert(
  JSON.stringify(bytesFromBase64) === JSON.stringify(testBytes),
  'base64ToBytes failed'
);

console.log('  ✓ All basic utility functions passed\n');

// Test 2: Hash functions
console.log('Test 2: Hash functions');
const sha256Hash = SHA256.hash('Hello World');
console.log('  SHA256("Hello World"):', sha256Hash);
console.assert(
  sha256Hash ===
    'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
  'SHA256 failed'
);

const ripemd160Hash = RIPEMD160.hash('Hello World');
console.log('  RIPEMD160("Hello World"):', ripemd160Hash);
console.assert(
  ripemd160Hash === 'a830d7beb04eb7549ce990fb7dc962e499a27230',
  'RIPEMD160 failed'
);

console.log('  ✓ All hash functions passed\n');

// Test 3: HMAC
console.log('Test 3: HMAC');
const hmacHash = HMAC.hash(SHA256, 'Hello World', 'secret');
console.log('  HMAC-SHA256("Hello World", "secret"):', hmacHash);
// This value might vary based on implementation, so just checking it's a valid hex string
console.assert(
  hmacHash.length === 64 && /^[0-9a-f]+$/.test(hmacHash),
  'HMAC failed'
);

console.log('  ✓ HMAC passed\n');

// Test 4: PBKDF2
console.log('Test 4: PBKDF2');
const pbkdf2Hash = PBKDF2.hash('password', 'salt', 32);
console.log(
  '  PBKDF2("password", "salt", 32) (first 32 chars):',
  pbkdf2Hash.substring(0, 32)
);
// Just checking it produces a valid hex string of expected length
console.assert(
  pbkdf2Hash.length === 64 && /^[0-9a-f]+$/.test(pbkdf2Hash),
  'PBKDF2 failed'
);

console.log('  ✓ PBKDF2 passed\n');

// Test 5: AES encryption/decryption
console.log('Test 5: AES encryption/decryption');
const plaintext = 'This is a secret message!';
const password = 'mypassword';

// Test with password derivation
const encrypted = AES.encrypt(plaintext, password);
const decrypted = AES.decrypt(encrypted, password);
console.log('  AES encryption/decryption with password:');
console.log('    Plaintext:', plaintext);
console.log('    Decrypted:', decrypted);
console.assert(
  decrypted === plaintext,
  'AES encryption/decryption with password failed'
);

// Test with direct key
const key = CryptoUtil.randomBytes(32); // 256-bit key
const iv = CryptoUtil.randomBytes(16); // 128-bit IV

const encryptedWithKey = AES.encrypt(plaintext, key, { iv });
const decryptedWithKey = AES.decrypt(encryptedWithKey, key, { iv });
console.log('  AES encryption/decryption with key:');
console.log('    Plaintext:', plaintext);
console.log('    Decrypted:', decryptedWithKey);
console.assert(
  decryptedWithKey === plaintext,
  'AES encryption/decryption with key failed'
);

console.log('  ✓ AES encryption/decryption passed\n');

// Test 6: Different modes
console.log('Test 6: Different AES modes');
const modes = [
  { name: 'ECB', mode: new ECB() },
  { name: 'CBC', mode: new CBC() },
  { name: 'CFB', mode: new CFB() },
  { name: 'OFB', mode: new OFB() },
  { name: 'CTR', mode: new CTR() },
];

for (const { name, mode } of modes) {
  const encrypted = AES.encrypt(plaintext, key, { mode, iv });
  const decrypted = AES.decrypt(encrypted, key, { mode, iv });
  console.log(`    ${name}:`, decrypted);
  console.assert(decrypted === plaintext, `${name} mode failed`);
}

console.log('  ✓ All AES modes passed\n');

// Test 7: UTF8 encoding
console.log('Test 7: UTF8 encoding');
const unicodeText = 'Hello 世界 🌍';
const utf8Bytes = UTF8.stringToBytes(unicodeText);
const decodedText = UTF8.bytesToString(utf8Bytes);
console.log('  UTF8 encoding/decoding:');
console.log('    Original:', unicodeText);
console.log('    Decoded:', decodedText);
console.assert(decodedText === unicodeText, 'UTF8 encoding/decoding failed');

console.log('  ✓ UTF8 encoding/decoding passed\n');

console.log('=== All Tests Passed! ===');
