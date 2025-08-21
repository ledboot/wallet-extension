// Example usage of the ES6 crypto module

import { AES, CryptoUtil, SHA256 } from './crypto-es6.js';

// Hash a message with SHA256
const message = 'Hello, world!';
const hash = SHA256.hash(message);
console.log(`SHA256 hash of "${message}":`, hash);

// Encrypt a message with AES
const plaintext = 'This is a secret message!';
const password = 'mysecretpassword';

// Encrypt using password (key will be derived using PBKDF2)
const encrypted = AES.encrypt(plaintext, password);
console.log('Encrypted message:', encrypted);

// Decrypt the message
const decrypted = AES.decrypt(encrypted, password);
console.log('Decrypted message:', decrypted);

// Or use a direct key for encryption
const key = CryptoUtil.randomBytes(32); // 256-bit key
const iv = CryptoUtil.randomBytes(16); // 128-bit IV

const encryptedWithKey = AES.encrypt(plaintext, key, { iv });
const decryptedWithKey = AES.decrypt(encryptedWithKey, key, { iv });

console.log('Encrypted with key:', encryptedWithKey);
console.log('Decrypted with key:', decryptedWithKey);
