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

// Test CryptoUtil functions
console.log('Testing CryptoUtil functions...');

// Test bytesToHex and hexToBytes
const testBytes = [0x48, 0x65, 0x6c, 0x6c, 0x6f]; // "Hello"
const hex = CryptoUtil.bytesToHex(testBytes);
console.log('bytesToHex:', hex); // Should be "48656c6c6f"

const bytes = CryptoUtil.hexToBytes(hex);
console.log('hexToBytes:', bytes); // Should be [72, 101, 108, 108, 111]

// Test bytesToBase64 and base64ToBytes
const base64 = CryptoUtil.bytesToBase64(testBytes);
console.log('bytesToBase64:', base64); // Should be "SGVsbG8="

const bytesFromBase64 = CryptoUtil.base64ToBytes(base64);
console.log('base64ToBytes:', bytesFromBase64); // Should be [72, 101, 108, 108, 111]

// Test SHA256
console.log('\nTesting SHA256...');
const sha256Hash = SHA256.hash('Hello World');
console.log('SHA256 hash:', sha256Hash);

// Test HMAC
console.log('\nTesting HMAC...');
const hmacHash = HMAC.hash(SHA256, 'Hello World', 'secret');
console.log('HMAC hash:', hmacHash);

// Test PBKDF2
console.log('\nTesting PBKDF2...');
const pbkdf2Hash = PBKDF2.hash('password', 'salt', 32);
console.log('PBKDF2 hash (first 16 bytes):', pbkdf2Hash.substring(0, 32));

// Test AES encryption/decryption
console.log('\nTesting AES encryption/decryption...');
const plaintext = 'This is a secret message!';
const password = 'mypassword';
const encrypted = AES.encrypt(plaintext, password);
console.log('Encrypted:', encrypted);

const decrypted = AES.decrypt(encrypted, password);
console.log('Decrypted:', decrypted);

// Test different modes
console.log('\nTesting different AES modes...');
const iv = CryptoUtil.randomBytes(16);
const key = CryptoUtil.randomBytes(32);

// ECB mode
const ecbEncrypted = AES.encrypt(plaintext, key, { mode: new ECB(), iv: iv });
const ecbDecrypted = AES.decrypt(ecbEncrypted, key, {
  mode: new ECB(),
  iv: iv,
});
console.log('ECB Decrypted:', ecbDecrypted);

// CBC mode
const cbcEncrypted = AES.encrypt(plaintext, key, { mode: new CBC(), iv: iv });
const cbcDecrypted = AES.decrypt(cbcEncrypted, key, {
  mode: new CBC(),
  iv: iv,
});
console.log('CBC Decrypted:', cbcDecrypted);

// CFB mode
const cfbEncrypted = AES.encrypt(plaintext, key, { mode: new CFB(), iv: iv });
const cfbDecrypted = AES.decrypt(cfbEncrypted, key, {
  mode: new CFB(),
  iv: iv,
});
console.log('CFB Decrypted:', cfbDecrypted);

// OFB mode
const ofbEncrypted = AES.encrypt(plaintext, key, { mode: new OFB(), iv: iv });
const ofbDecrypted = AES.decrypt(ofbEncrypted, key, {
  mode: new OFB(),
  iv: iv,
});
console.log('OFB Decrypted:', ofbDecrypted);

// CTR mode
const ctrEncrypted = AES.encrypt(plaintext, key, { mode: new CTR(), iv: iv });
const ctrDecrypted = AES.decrypt(ctrEncrypted, key, {
  mode: new CTR(),
  iv: iv,
});
console.log('CTR Decrypted:', ctrDecrypted);

// Test RIPEMD160
console.log('\nTesting RIPEMD160...');
const ripemd160Hash = RIPEMD160.hash('Hello World');
console.log('RIPEMD160 hash:', ripemd160Hash);

console.log('\nAll tests completed!');
