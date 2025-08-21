// Crypto utilities
const base64map =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export class CryptoUtil {
  // Bit-wise rotate left
  static rotl(n, b) {
    return (n << b) | (n >>> (32 - b));
  }

  // Bit-wise rotate right
  static rotr(n, b) {
    return (n << (32 - b)) | (n >>> b);
  }

  // Swap big-endian to little-endian and vice versa
  static endian(n) {
    // If number given, swap endian
    if (typeof n === 'number') {
      return (
        (CryptoUtil.rotl(n, 8) & 0x00ff00ff) |
        (CryptoUtil.rotl(n, 24) & 0xff00ff00)
      );
    }

    // Else, assume array and swap all items
    for (let i = 0; i < n.length; i++) n[i] = CryptoUtil.endian(n[i]);
    return n;
  }

  // Generate an array of any length of random bytes
  static randomBytes(n) {
    const bytes = [];
    for (let i = 0; i < n; i++) bytes.push(Math.floor(Math.random() * 256));
    return bytes;
  }

  // Convert a byte array to big-endian 32-bit words
  static bytesToWords(bytes) {
    const words = [];
    for (let i = 0, b = 0; i < bytes.length; i++, b += 8)
      words[b >>> 5] |= (bytes[i] & 0xff) << (24 - (b % 32));
    return words;
  }

  // Convert big-endian 32-bit words to a byte array
  static wordsToBytes(words) {
    const bytes = [];
    for (let b = 0; b < words.length * 32; b += 8)
      bytes.push((words[b >>> 5] >>> (24 - (b % 32))) & 0xff);
    return bytes;
  }

  // Convert a byte array to a hex string
  static bytesToHex(bytes) {
    const hex = [];
    for (let i = 0; i < bytes.length; i++) {
      hex.push((bytes[i] >>> 4).toString(16));
      hex.push((bytes[i] & 0xf).toString(16));
    }
    return hex.join('');
  }

  // Convert a hex string to a byte array
  static hexToBytes(hex) {
    const bytes = [];
    for (let c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
  }

  // Convert a byte array to a base-64 string
  static bytesToBase64(bytes) {
    const base64 = [];
    for (let i = 0; i < bytes.length; i += 3) {
      const triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      for (let j = 0; j < 4; j++) {
        if (i * 8 + j * 6 <= bytes.length * 8)
          base64.push(base64map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
        else base64.push('=');
      }
    }

    return base64.join('');
  }

  // Convert a base-64 string to a byte array
  static base64ToBytes(base64) {
    // Remove non-base-64 characters
    base64 = base64.replace(/[^A-Z0-9+\/]/gi, '');

    const bytes = [];
    for (let i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {
      if (imod4 == 0) continue;
      bytes.push(
        ((base64map.indexOf(base64.charAt(i - 1)) &
          (Math.pow(2, -2 * imod4 + 8) - 1)) <<
          (imod4 * 2)) |
          (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2))
      );
    }

    return bytes;
  }

  // Convert a byte array to little-endian 32-bit words
  static bytesToLWords(bytes) {
    const output = Array(bytes.length >> 2);
    for (let i = 0; i < output.length; i++) output[i] = 0;
    for (let i = 0; i < bytes.length * 8; i += 8)
      output[i >> 5] |= (bytes[i / 8] & 0xff) << i % 32;
    return output;
  }

  // Convert little-endian 32-bit words to a byte array
  static lWordsToBytes(words) {
    const output = [];
    for (let i = 0; i < words.length * 32; i += 8)
      output.push((words[i >> 5] >>> i % 32) & 0xff);
    return output;
  }
}

// Crypto character encodings
export class UTF8 {
  // Convert a string to a byte array
  static stringToBytes(str) {
    return Binary.stringToBytes(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode('0x' + p1);
      })
    );
  }

  // Convert a byte array to a string
  static bytesToString(bytes) {
    return decodeURIComponent(
      bytes
        .map((byte) => {
          return '%' + ('0' + byte.toString(16)).slice(-2);
        })
        .join('')
    );
  }
}

export class Binary {
  // Convert a string to a byte array
  static stringToBytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 0xff);
    return bytes;
  }

  // Convert a byte array to a string
  static bytesToString(bytes) {
    const str = [];
    for (let i = 0; i < bytes.length; i++)
      str.push(String.fromCharCode(bytes[i]));
    return str.join('');
  }
}

// SHA256 implementation
export class SHA256 {
  // Constants
  static K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  static _blocksize = 16;
  static _digestsize = 32;

  // Public API
  static hash(message, options = {}) {
    const digestbytes = CryptoUtil.wordsToBytes(SHA256._sha256(message));
    return options.asBytes
      ? digestbytes
      : options.asString
        ? Binary.bytesToString(digestbytes)
        : CryptoUtil.bytesToHex(digestbytes);
  }

  // The core
  static _sha256(message) {
    // Convert to byte array
    if (typeof message === 'string') message = UTF8.stringToBytes(message);
    /* else, assume byte array already */

    const m = CryptoUtil.bytesToWords(message);
    const l = message.length * 8;
    const H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
      0x1f83d9ab, 0x5be0cd19,
    ];
    const w = [];
    let a, b, c, d, e, f, g, h, i, j;
    let t1, t2;

    // Padding
    m[l >> 5] |= 0x80 << (24 - (l % 32));
    m[(((l + 64) >> 9) << 4) + 15] = l;

    for (i = 0; i < m.length; i += 16) {
      a = H[0];
      b = H[1];
      c = H[2];
      d = H[3];
      e = H[4];
      f = H[5];
      g = H[6];
      h = H[7];

      for (j = 0; j < 64; j++) {
        if (j < 16) w[j] = m[j + i];
        else {
          const gamma0x = w[j - 15];
          const gamma1x = w[j - 2];
          const gamma0 =
            ((gamma0x << 25) | (gamma0x >>> 7)) ^
            ((gamma0x << 14) | (gamma0x >>> 18)) ^
            (gamma0x >>> 3);
          const gamma1 =
            ((gamma1x << 15) | (gamma1x >>> 17)) ^
            ((gamma1x << 13) | (gamma1x >>> 19)) ^
            (gamma1x >>> 10);

          w[j] = gamma0 + (w[j - 7] >>> 0) + gamma1 + (w[j - 16] >>> 0);
        }

        const ch = (e & f) ^ (~e & g);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const sigma0 =
          ((a << 30) | (a >>> 2)) ^
          ((a << 19) | (a >>> 13)) ^
          ((a << 10) | (a >>> 22));
        const sigma1 =
          ((e << 26) | (e >>> 6)) ^
          ((e << 21) | (e >>> 11)) ^
          ((e << 7) | (e >>> 25));

        t1 = (h >>> 0) + sigma1 + ch + SHA256.K[j] + (w[j] >>> 0);
        t2 = sigma0 + maj;

        h = g;
        g = f;
        f = e;
        e = (d + t1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) >>> 0;
      }

      H[0] += a;
      H[1] += b;
      H[2] += c;
      H[3] += d;
      H[4] += e;
      H[5] += f;
      H[6] += g;
      H[7] += h;
    }

    return H;
  }
}

// HMAC implementation
export class HMAC {
  static hash(hasher, message, key, options = {}) {
    // Convert to byte arrays
    if (typeof message === 'string') message = UTF8.stringToBytes(message);
    if (typeof key === 'string') key = UTF8.stringToBytes(key);
    /* else, assume byte arrays already */

    // Allow arbitrary length keys
    if (key.length > hasher._blocksize * 4)
      key = hasher.hash(key, { asBytes: true });

    // XOR keys with pad constants
    const okey = key.slice(0);
    const ikey = key.slice(0);
    for (let i = 0; i < hasher._blocksize * 4; i++) {
      okey[i] ^= 0x5c;
      ikey[i] ^= 0x36;
    }

    const hmacbytes = hasher.hash(
      okey.concat(hasher.hash(ikey.concat(message), { asBytes: true })),
      { asBytes: true }
    );

    return options.asBytes
      ? hmacbytes
      : options.asString
        ? Binary.bytesToString(hmacbytes)
        : CryptoUtil.bytesToHex(hmacbytes);
  }
}

// PBKDF2 implementation
export class PBKDF2 {
  static hash(password, salt, keylen, options = {}) {
    // Convert to byte arrays
    if (typeof password === 'string') password = UTF8.stringToBytes(password);
    if (typeof salt === 'string') salt = UTF8.stringToBytes(salt);
    /* else, assume byte arrays already */

    // Defaults
    const hasher = options.hasher || SHA256;
    const iterations = options.iterations || 1;

    // Pseudo-random function
    function PRF(password, salt) {
      return HMAC.hash(hasher, salt, password, { asBytes: true });
    }

    // Generate key
    let derivedKeyBytes = [];
    let blockindex = 1;
    while (derivedKeyBytes.length < keylen) {
      let block = PRF(
        password,
        salt.concat(CryptoUtil.wordsToBytes([blockindex]))
      );
      for (let u = block, i = 1; i < iterations; i++) {
        u = PRF(password, u);
        for (let j = 0; j < block.length; j++) block[j] ^= u[j];
      }
      derivedKeyBytes = derivedKeyBytes.concat(block);
      blockindex++;
    }

    // Truncate excess bytes
    derivedKeyBytes.length = keylen;

    return options.asBytes
      ? derivedKeyBytes
      : options.asString
        ? Binary.bytesToString(derivedKeyBytes)
        : CryptoUtil.bytesToHex(derivedKeyBytes);
  }
}

// AES implementation
export class AES {
  // Precomputed SBOX
  static SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b,
    0xfe, 0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0,
    0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26,
    0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2,
    0xeb, 0x27, 0xb2, 0x75, 0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0,
    0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed,
    0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f,
    0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5,
    0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c, 0x13, 0xec,
    0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14,
    0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c,
    0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d,
    0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f,
    0x4b, 0xbd, 0x8b, 0x8a, 0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e,
    0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11,
    0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f,
    0xb0, 0x54, 0xbb, 0x16,
  ];

  // Compute inverse SBOX lookup table
  static INVSBOX = (() => {
    const invsbox = [];
    for (let i = 0; i < 256; i++) invsbox[AES.SBOX[i]] = i;
    return invsbox;
  })();

  // Compute multiplication in GF(2^8) lookup tables
  static MULT2 = [];
  static MULT3 = [];
  static MULT9 = [];
  static MULTB = [];
  static MULTD = [];
  static MULTE = [];

  static _blocksize = 4;

  // Initialize multiplication tables
  static init() {
    function xtime(a, b) {
      let result = 0;
      for (let i = 0; i < 8; i++) {
        if (b & 1) result ^= a;
        const hiBitSet = a & 0x80;
        a = (a << 1) & 0xff;
        if (hiBitSet) a ^= 0x1b;
        b >>>= 1;
      }
      return result;
    }

    for (let i = 0; i < 256; i++) {
      AES.MULT2[i] = xtime(i, 2);
      AES.MULT3[i] = xtime(i, 3);
      AES.MULT9[i] = xtime(i, 9);
      AES.MULTB[i] = xtime(i, 0xb);
      AES.MULTD[i] = xtime(i, 0xd);
      AES.MULTE[i] = xtime(i, 0xe);
    }
  }

  // Precomputed RCon lookup
  static RCON = [
    0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36,
  ];

  // Inner state
  static state = [[], [], [], []];
  static keylength;
  static nrounds;
  static keyschedule;

  /**
   * Public API
   */
  static encrypt(message, password, options = {}) {
    // Determine mode
    const mode = options.mode || new OFB();

    // Allow mode to override options
    if (mode.fixOptions) mode.fixOptions(options);

    // Convert to bytes if message is a string
    let m = typeof message === 'string' ? UTF8.stringToBytes(message) : message;

    // Generate random IV
    const iv = options.iv || CryptoUtil.randomBytes(AES._blocksize * 4);

    // Generate key
    const k =
      typeof password === 'string'
        ? // Derive key from pass-phrase
          PBKDF2.hash(password, iv, 32, { asBytes: true })
        : // else, assume byte array representing cryptographic key
          password;

    // Encrypt
    AES._init(k);
    mode.encrypt(AES, m, iv);

    // Return ciphertext
    m = options.iv ? m : iv.concat(m);
    return options.asBytes ? m : CryptoUtil.bytesToBase64(m);
  }

  static decrypt(ciphertext, password, options = {}) {
    // Determine mode
    const mode = options.mode || new OFB();

    // Allow mode to override options
    if (mode.fixOptions) mode.fixOptions(options);

    // Convert to bytes if ciphertext is a string
    let c =
      typeof ciphertext === 'string'
        ? CryptoUtil.base64ToBytes(ciphertext)
        : ciphertext;

    // Separate IV and message
    const iv = options.iv || c.splice(0, AES._blocksize * 4);

    // Generate key
    const k =
      typeof password === 'string'
        ? // Derive key from pass-phrase
          PBKDF2.hash(password, iv, 32, { asBytes: true })
        : // else, assume byte array representing cryptographic key
          password;

    // Decrypt
    AES._init(k);
    mode.decrypt(AES, c, iv);

    // Return plaintext
    return options.asBytes ? c : UTF8.bytesToString(c);
  }

  /**
   * Package private methods and properties
   */
  static _encryptblock(m, offset) {
    // Set input
    for (let row = 0; row < AES._blocksize; row++) {
      for (let col = 0; col < 4; col++)
        AES.state[row][col] = m[offset + col * 4 + row];
    }

    // Add round key
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++)
        AES.state[row][col] ^= AES.keyschedule[col][row];
    }

    for (let round = 1; round < AES.nrounds; round++) {
      // Sub bytes
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++)
          AES.state[row][col] = AES.SBOX[AES.state[row][col]];
      }

      // Shift rows
      AES.state[1].push(AES.state[1].shift());
      AES.state[2].push(AES.state[2].shift());
      AES.state[2].push(AES.state[2].shift());
      AES.state[3].unshift(AES.state[3].pop());

      // Mix columns
      for (let col = 0; col < 4; col++) {
        const s0 = AES.state[0][col];
        const s1 = AES.state[1][col];
        const s2 = AES.state[2][col];
        const s3 = AES.state[3][col];

        AES.state[0][col] = AES.MULT2[s0] ^ AES.MULT3[s1] ^ s2 ^ s3;
        AES.state[1][col] = s0 ^ AES.MULT2[s1] ^ AES.MULT3[s2] ^ s3;
        AES.state[2][col] = s0 ^ s1 ^ AES.MULT2[s2] ^ AES.MULT3[s3];
        AES.state[3][col] = AES.MULT3[s0] ^ s1 ^ s2 ^ AES.MULT2[s3];
      }

      // Add round key
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++)
          AES.state[row][col] ^= AES.keyschedule[round * 4 + col][row];
      }
    }

    // Sub bytes
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++)
        AES.state[row][col] = AES.SBOX[AES.state[row][col]];
    }

    // Shift rows
    AES.state[1].push(AES.state[1].shift());
    AES.state[2].push(AES.state[2].shift());
    AES.state[2].push(AES.state[2].shift());
    AES.state[3].unshift(AES.state[3].pop());

    // Add round key
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++)
        AES.state[row][col] ^= AES.keyschedule[AES.nrounds * 4 + col][row];
    }

    // Set output
    for (let row = 0; row < AES._blocksize; row++) {
      for (let col = 0; col < 4; col++)
        m[offset + col * 4 + row] = AES.state[row][col];
    }
  }

  static _decryptblock(c, offset) {
    // Set input
    for (let row = 0; row < AES._blocksize; row++) {
      for (let col = 0; col < 4; col++)
        AES.state[row][col] = c[offset + col * 4 + row];
    }

    // Add round key
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++)
        AES.state[row][col] ^= AES.keyschedule[AES.nrounds * 4 + col][row];
    }

    for (let round = 1; round < AES.nrounds; round++) {
      // Inv shift rows
      AES.state[1].unshift(AES.state[1].pop());
      AES.state[2].push(AES.state[2].shift());
      AES.state[2].push(AES.state[2].shift());
      AES.state[3].push(AES.state[3].shift());

      // Inv sub bytes
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++)
          AES.state[row][col] = AES.INVSBOX[AES.state[row][col]];
      }

      // Add round key
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++)
          AES.state[row][col] ^=
            AES.keyschedule[(AES.nrounds - round) * 4 + col][row];
      }

      // Inv mix columns
      for (let col = 0; col < 4; col++) {
        const s0 = AES.state[0][col];
        const s1 = AES.state[1][col];
        const s2 = AES.state[2][col];
        const s3 = AES.state[3][col];

        AES.state[0][col] =
          AES.MULTE[s0] ^ AES.MULTB[s1] ^ AES.MULTD[s2] ^ AES.MULT9[s3];
        AES.state[1][col] =
          AES.MULT9[s0] ^ AES.MULTE[s1] ^ AES.MULTB[s2] ^ AES.MULTD[s3];
        AES.state[2][col] =
          AES.MULTD[s0] ^ AES.MULT9[s1] ^ AES.MULTE[s2] ^ AES.MULTB[s3];
        AES.state[3][col] =
          AES.MULTB[s0] ^ AES.MULTD[s1] ^ AES.MULT9[s2] ^ AES.MULTE[s3];
      }
    }

    // Inv shift rows
    AES.state[1].unshift(AES.state[1].pop());
    AES.state[2].push(AES.state[2].shift());
    AES.state[2].push(AES.state[2].shift());
    AES.state[3].push(AES.state[3].shift());

    // Inv sub bytes
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++)
        AES.state[row][col] = AES.INVSBOX[AES.state[row][col]];
    }

    // Add round key
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++)
        AES.state[row][col] ^= AES.keyschedule[col][row];
    }

    // Set output
    for (let row = 0; row < AES._blocksize; row++) {
      for (let col = 0; col < 4; col++)
        c[offset + col * 4 + row] = AES.state[row][col];
    }
  }

  /**
   * Private methods
   */
  static _init(k) {
    AES.keylength = k.length / 4;
    AES.nrounds = AES.keylength + 6;
    AES._keyexpansion(k);
  }

  // Generate a key schedule
  static _keyexpansion(k) {
    AES.keyschedule = [];

    for (let row = 0; row < AES.keylength; row++) {
      AES.keyschedule[row] = [
        k[row * 4],
        k[row * 4 + 1],
        k[row * 4 + 2],
        k[row * 4 + 3],
      ];
    }

    for (
      let row = AES.keylength;
      row < AES._blocksize * (AES.nrounds + 1);
      row++
    ) {
      const temp = [
        AES.keyschedule[row - 1][0],
        AES.keyschedule[row - 1][1],
        AES.keyschedule[row - 1][2],
        AES.keyschedule[row - 1][3],
      ];

      if (row % AES.keylength == 0) {
        // Rot word
        temp.push(temp.shift());

        // Sub word
        temp[0] = AES.SBOX[temp[0]];
        temp[1] = AES.SBOX[temp[1]];
        temp[2] = AES.SBOX[temp[2]];
        temp[3] = AES.SBOX[temp[3]];

        temp[0] ^= AES.RCON[row / AES.keylength];
      } else if (AES.keylength > 6 && row % AES.keylength == 4) {
        // Sub word
        temp[0] = AES.SBOX[temp[0]];
        temp[1] = AES.SBOX[temp[1]];
        temp[2] = AES.SBOX[temp[2]];
        temp[3] = AES.SBOX[temp[3]];
      }

      AES.keyschedule[row] = [
        AES.keyschedule[row - AES.keylength][0] ^ temp[0],
        AES.keyschedule[row - AES.keylength][1] ^ temp[1],
        AES.keyschedule[row - AES.keylength][2] ^ temp[2],
        AES.keyschedule[row - AES.keylength][3] ^ temp[3],
      ];
    }
  }
}

// Initialize AES multiplication tables
AES.init();

// Padding modes
export class NoPadding {
  pad(cipher, message) {}
  unpad(cipher, message) {}
}

export class ZeroPadding {
  pad(cipher, message) {
    const blockSizeInBytes = cipher._blocksize * 4;
    const reqd = message.length % blockSizeInBytes;
    if (reqd != 0) {
      for (let i = 0; i < blockSizeInBytes - reqd; i++) {
        message.push(0x00);
      }
    }
  }

  unpad(cipher, message) {
    while (message[message.length - 1] == 0) {
      message.pop();
    }
  }
}

export class Iso7816 {
  pad(cipher, message) {
    const reqd = _requiredPadding(cipher, message);
    message.push(0x80);
    for (let i = 1; i < reqd; i++) {
      message.push(0x00);
    }
  }

  unpad(cipher, message) {
    const blockSizeInBytes = cipher._blocksize * 4;
    for (let padLength = blockSizeInBytes; padLength > 0; padLength--) {
      const b = message.pop();
      if (b == 0x80) return;
      if (b != 0x00) {
        throw new Error(
          'ISO-7816 padding byte must be 0, not 0x' +
            b.toString(16) +
            '. Wrong cipher specification or key used?'
        );
      }
    }
    throw new Error(
      'ISO-7816 padded beyond cipher block size. Wrong cipher specification or key used?'
    );
  }
}

export class AnsiX923 {
  pad(cipher, message) {
    const reqd = _requiredPadding(cipher, message);
    for (let i = 1; i < reqd; i++) {
      message.push(0x00);
    }
    message.push(reqd);
  }

  unpad(cipher, message) {
    _unpadLength(cipher, message, 'ANSI X.923', 0);
  }
}

export class Iso10126 {
  pad(cipher, message) {
    const reqd = _requiredPadding(cipher, message);
    for (let i = 1; i < reqd; i++) {
      message.push(Math.floor(Math.random() * 256));
    }
    message.push(reqd);
  }

  unpad(cipher, message) {
    _unpadLength(cipher, message, 'ISO 10126', undefined);
  }
}

export class Pkcs7 {
  pad(cipher, message) {
    const reqd = _requiredPadding(cipher, message);
    for (let i = 0; i < reqd; i++) {
      message.push(reqd);
    }
  }

  unpad(cipher, message) {
    _unpadLength(cipher, message, 'PKCS 7', message[message.length - 1]);
  }
}

// Calculate the number of padding bytes required.
function _requiredPadding(cipher, message) {
  const blockSizeInBytes = cipher._blocksize * 4;
  const reqd = blockSizeInBytes - (message.length % blockSizeInBytes);
  return reqd;
}

// Remove padding when the final byte gives the number of padding bytes.
function _unpadLength(cipher, message, alg, padding) {
  const pad = message.pop();
  if (pad == 0) {
    throw new Error(
      'Invalid zero-length padding specified for ' +
        alg +
        '. Wrong cipher specification or key used?'
    );
  }
  const maxPad = cipher._blocksize * 4;
  if (pad > maxPad) {
    throw new Error(
      'Invalid padding length of ' +
        pad +
        ' specified for ' +
        alg +
        '. Wrong cipher specification or key used?'
    );
  }
  for (let i = 1; i < pad; i++) {
    const b = message.pop();
    if (padding != undefined && padding != b) {
      throw new Error(
        'Invalid padding byte of 0x' +
          b.toString(16) +
          ' specified for ' +
          alg +
          '. Wrong cipher specification or key used?'
      );
    }
  }
}

// Mode base "class"
export class Mode {
  constructor(padding) {
    this._padding = padding || new Iso7816();
  }

  encrypt(cipher, m, iv) {
    this._padding.pad(cipher, m);
    this._doEncrypt(cipher, m, iv);
  }

  decrypt(cipher, m, iv) {
    this._doDecrypt(cipher, m, iv);
    this._padding.unpad(cipher, m);
  }
}

/**
 * Electronic Code Book mode.
 *
 * ECB applies the cipher directly against each block of the input.
 *
 * ECB does not require an initialization vector.
 */
export class ECB extends Mode {
  constructor(padding) {
    super(padding);
  }

  _doEncrypt(cipher, m, iv) {
    const blockSizeInBytes = cipher._blocksize * 4;
    // Encrypt each block
    for (let offset = 0; offset < m.length; offset += blockSizeInBytes) {
      cipher._encryptblock(m, offset);
    }
  }

  _doDecrypt(cipher, c, iv) {
    const blockSizeInBytes = cipher._blocksize * 4;
    // Decrypt each block
    for (let offset = 0; offset < c.length; offset += blockSizeInBytes) {
      cipher._decryptblock(c, offset);
    }
  }

  fixOptions(options) {
    options.iv = [];
  }
}

/**
 * Cipher block chaining
 *
 * The first block is XORed with the IV. Subsequent blocks are XOR with the
 * previous cipher output.
 */
export class CBC extends Mode {
  constructor(padding) {
    super(padding);
  }

  _doEncrypt(cipher, m, iv) {
    const blockSizeInBytes = cipher._blocksize * 4;

    // Encrypt each block
    for (let offset = 0; offset < m.length; offset += blockSizeInBytes) {
      if (offset == 0) {
        // XOR first block using IV
        for (let i = 0; i < blockSizeInBytes; i++) m[i] ^= iv[i];
      } else {
        // XOR this block using previous crypted block
        for (let i = 0; i < blockSizeInBytes; i++)
          m[offset + i] ^= m[offset + i - blockSizeInBytes];
      }
      // Encrypt block
      cipher._encryptblock(m, offset);
    }
  }

  _doDecrypt(cipher, c, iv) {
    const blockSizeInBytes = cipher._blocksize * 4;

    // At the start, the previously crypted block is the IV
    let prevCryptedBlock = iv;

    // Decrypt each block
    for (let offset = 0; offset < c.length; offset += blockSizeInBytes) {
      // Save this crypted block
      const thisCryptedBlock = c.slice(offset, offset + blockSizeInBytes);
      // Decrypt block
      cipher._decryptblock(c, offset);
      // XOR decrypted block using previous crypted block
      for (let i = 0; i < blockSizeInBytes; i++) {
        c[offset + i] ^= prevCryptedBlock[i];
      }
      prevCryptedBlock = thisCryptedBlock;
    }
  }
}

/**
 * Cipher feed back
 *
 * The cipher output is XORed with the plain text to produce the cipher output,
 * which is then fed back into the cipher to produce a bit pattern to XOR the
 * next block with.
 *
 * This is a stream cipher mode and does not require padding.
 */
export class CFB extends Mode {
  constructor() {
    super(new NoPadding());
  }

  _doEncrypt(cipher, m, iv) {
    const blockSizeInBytes = cipher._blocksize * 4;
    let keystream = iv.slice(0);

    // Encrypt each byte
    for (let i = 0; i < m.length; i++) {
      const j = i % blockSizeInBytes;
      if (j == 0) cipher._encryptblock(keystream, 0);

      m[i] ^= keystream[j];
      keystream[j] = m[i];
    }
  }

  _doDecrypt(cipher, c, iv) {
    const blockSizeInBytes = cipher._blocksize * 4;
    let keystream = iv.slice(0);

    // Encrypt each byte
    for (let i = 0; i < c.length; i++) {
      const j = i % blockSizeInBytes;
      if (j == 0) cipher._encryptblock(keystream, 0);

      const b = c[i];
      c[i] ^= keystream[j];
      keystream[j] = b;
    }
  }
}

/**
 * Output feed back
 *
 * The cipher repeatedly encrypts its own output. The output is XORed with the
 * plain text to produce the cipher text.
 *
 * This is a stream cipher mode and does not require padding.
 */
export class OFB extends Mode {
  constructor() {
    super(new NoPadding());
  }

  _doEncrypt(cipher, m, iv) {
    const blockSizeInBytes = cipher._blocksize * 4;
    let keystream = iv.slice(0);

    // Encrypt each byte
    for (let i = 0; i < m.length; i++) {
      // Generate keystream
      if (i % blockSizeInBytes == 0) cipher._encryptblock(keystream, 0);

      // Encrypt byte
      m[i] ^= keystream[i % blockSizeInBytes];
    }
  }

  _doDecrypt(cipher, m, iv) {
    this._doEncrypt(cipher, m, iv);
  }
}

/**
 * Counter
 * @author Gergely Risko
 *
 * After every block the last 4 bytes of the IV is increased by one
 * with carry and that IV is used for the next block.
 *
 * This is a stream cipher mode and does not require padding.
 */
export class CTR extends Mode {
  constructor() {
    super(new NoPadding());
  }

  _doEncrypt(cipher, m, iv) {
    const blockSizeInBytes = cipher._blocksize * 4;
    let counter = iv.slice(0);

    for (let i = 0; i < m.length; ) {
      // do not lose iv
      let keystream = counter.slice(0);

      // Generate keystream for next block
      cipher._encryptblock(keystream, 0);

      // XOR keystream with block
      for (let j = 0; i < m.length && j < blockSizeInBytes; j++, i++) {
        m[i] ^= keystream[j];
      }

      // Increase counter
      if (++counter[blockSizeInBytes - 1] == 256) {
        counter[blockSizeInBytes - 1] = 0;
        if (++counter[blockSizeInBytes - 2] == 256) {
          counter[blockSizeInBytes - 2] = 0;
          if (++counter[blockSizeInBytes - 3] == 256) {
            counter[blockSizeInBytes - 3] = 0;
            ++counter[blockSizeInBytes - 4];
          }
        }
      }
    }
  }

  _doDecrypt(cipher, m, iv) {
    this._doEncrypt(cipher, m, iv);
  }
}

// RIPEMD-160 implementation
export class RIPEMD160 {
  static hash(message, options = {}) {
    const digestbytes = CryptoUtil.lWordsToBytes(RIPEMD160._rmd160(message));
    return options.asBytes
      ? digestbytes
      : options.asString
        ? Binary.bytesToString(digestbytes)
        : CryptoUtil.bytesToHex(digestbytes);
  }

  // The core
  static _rmd160(message) {
    // Convert to byte array
    if (typeof message === 'string') message = UTF8.stringToBytes(message);

    const x = CryptoUtil.bytesToLWords(message);
    const len = message.length * 8;

    /* append padding */
    x[len >> 5] |= 0x80 << len % 32;
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    let h0 = 0x67452301;
    let h1 = 0xefcdab89;
    let h2 = 0x98badcfe;
    let h3 = 0x10325476;
    let h4 = 0xc3d2e1f0;

    for (let i = 0; i < x.length; i += 16) {
      let T;
      let A1 = h0,
        B1 = h1,
        C1 = h2,
        D1 = h3,
        E1 = h4;
      let A2 = h0,
        B2 = h1,
        C2 = h2,
        D2 = h3,
        E2 = h4;
      for (let j = 0; j <= 79; ++j) {
        T = RIPEMD160._safe_add(A1, RIPEMD160._rmd160_f(j, B1, C1, D1));
        T = RIPEMD160._safe_add(T, x[i + RIPEMD160.rmd160_r1[j]]);
        T = RIPEMD160._safe_add(T, RIPEMD160._rmd160_K1(j));
        T = RIPEMD160._safe_add(
          RIPEMD160._bit_rol(T, RIPEMD160.rmd160_s1[j]),
          E1
        );
        A1 = E1;
        E1 = D1;
        D1 = RIPEMD160._bit_rol(C1, 10);
        C1 = B1;
        B1 = T;
        T = RIPEMD160._safe_add(A2, RIPEMD160._rmd160_f(79 - j, B2, C2, D2));
        T = RIPEMD160._safe_add(T, x[i + RIPEMD160.rmd160_r2[j]]);
        T = RIPEMD160._safe_add(T, RIPEMD160._rmd160_K2(j));
        T = RIPEMD160._safe_add(
          RIPEMD160._bit_rol(T, RIPEMD160.rmd160_s2[j]),
          E2
        );
        A2 = E2;
        E2 = D2;
        D2 = RIPEMD160._bit_rol(C2, 10);
        C2 = B2;
        B2 = T;
      }
      T = RIPEMD160._safe_add(h1, RIPEMD160._safe_add(C1, D2));
      h1 = RIPEMD160._safe_add(h2, RIPEMD160._safe_add(D1, E2));
      h2 = RIPEMD160._safe_add(h3, RIPEMD160._safe_add(E1, A2));
      h3 = RIPEMD160._safe_add(h4, RIPEMD160._safe_add(A1, B2));
      h4 = RIPEMD160._safe_add(h0, RIPEMD160._safe_add(B1, C2));
      h0 = T;
    }
    return [h0, h1, h2, h3, h4];
  }

  static _rmd160_f(j, x, y, z) {
    return 0 <= j && j <= 15
      ? x ^ y ^ z
      : 16 <= j && j <= 31
        ? (x & y) | (~x & z)
        : 32 <= j && j <= 47
          ? (x | ~y) ^ z
          : 48 <= j && j <= 63
            ? (x & z) | (y & ~z)
            : 64 <= j && j <= 79
              ? x ^ (y | ~z)
              : 'rmd160_f: j out of range';
  }

  static _rmd160_K1(j) {
    return 0 <= j && j <= 15
      ? 0x00000000
      : 16 <= j && j <= 31
        ? 0x5a827999
        : 32 <= j && j <= 47
          ? 0x6ed9eba1
          : 48 <= j && j <= 63
            ? 0x8f1bbcdc
            : 64 <= j && j <= 79
              ? 0xa953fd4e
              : 'rmd160_K1: j out of range';
  }

  static _rmd160_K2(j) {
    return 0 <= j && j <= 15
      ? 0x50a28be6
      : 16 <= j && j <= 31
        ? 0x5c4dd124
        : 32 <= j && j <= 47
          ? 0x6d703ef3
          : 48 <= j && j <= 63
            ? 0x7a6d76e9
            : 64 <= j && j <= 79
              ? 0x00000000
              : 'rmd160_K2: j out of range';
  }

  static rmd160_r1 = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6,
    15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13,
    11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9,
    7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
  ];

  static rmd160_r2 = [
    5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5,
    10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10,
    0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10,
    4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
  ];

  static rmd160_s1 = [
    11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9,
    7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13,
    6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9,
    15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
  ];

  static rmd160_s2 = [
    8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8,
    9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14,
    13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5,
    12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
  ];

  /*
   * Add integers, wrapping at 2^32. This uses 16-bit operations internally
   * to work around bugs in some JS interpreters.
   */
  static _safe_add(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  /*
   * Bitwise rotate a 32-bit number to the left.
   */
  static _bit_rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
}
