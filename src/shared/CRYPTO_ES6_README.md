# ES6 Crypto Module

This is an ES6 version of the original Crypto-JS library, converted from the AMD module format to modern ES6 modules with classes.

## Features

- SHA256 hashing
- HMAC signing
- PBKDF2 key derivation
- AES encryption/decryption with multiple modes (ECB, CBC, CFB, OFB, CTR)
- Utility functions for encoding/decoding (hex, base64, UTF-8)
- RIPEMD-160 hashing

## Usage

Import the required classes:

```javascript
import { AES, CryptoUtil, HMAC, PBKDF2, SHA256, UTF8 } from './crypto-es6.js';
```

### Hashing

```javascript
// SHA256
const hash = SHA256.hash('Hello World');

// RIPEMD160
const ripemd160Hash = RIPEMD160.hash('Hello World');
```

### HMAC

```javascript
const hmac = HMAC.hash(SHA256, 'message', 'key');
```

### Key Derivation

```javascript
const derivedKey = PBKDF2.hash('password', 'salt', 32); // 32 bytes key
```

### Encryption/Decryption

```javascript
// With password (uses PBKDF2 internally)
const encrypted = AES.encrypt("Secret message", "password");
const decrypted = AES.decrypt(encrypted, "password");

// With direct key
const key = CryptoUtil.randomBytes(32); // 256-bit key
const iv = CryptoUtil.randomBytes(16);  // 128-bit IV
const encrypted = AES.encrypt("Secret message", key, { iv });
const decrypted = AES.decrypt(encrypted, key, { iv });
```

### Different Modes

```javascript
import { ECB, CBC, CFB, OFB, CTR } from './crypto-es6.js';

// ECB mode
const encrypted = AES.encrypt("Secret message", key, { mode: new ECB(), iv });

// CBC mode
const encrypted = AES.encrypt("Secret message", key, { mode: new CBC(), iv });

// And so on for other modes...
```

## Utility Functions

```javascript
// Encoding/decoding
const hex = CryptoUtil.bytesToHex([72, 101, 108, 108, 111]); // "48656c6c6f"
const bytes = CryptoUtil.hexToBytes("48656c6c6f"); // [72, 101, 108, 108, 111]

const base64 = CryptoUtil.bytesToBase64([72, 101, 108, 108, 111]); // "SGVsbG8="
const bytes = CryptoUtil.base64ToBytes("SGVsbG8="); // [72, 101, 108, 108, 111]

// UTF-8 encoding
const bytes = UTF8.stringToBytes("Hello 世界");
const string = UTF8.bytesToString(bytes);
```

## Testing

Run the tests:

```bash
node src/shared/crypto-es6.test.js
node src/shared/crypto-es6-comprehensive.test.js
```

## License

This code is based on the Crypto-JS library which is licensed under the BSD license.
