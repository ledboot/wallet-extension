import { base58 } from './base58';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';

/**
 * Decode a Base58Check address string.
 * Validates checksum (double SHA-256) and returns the first 21 bytes
 * [version(1) + hash160(20)].
 */
export class Address {
  static decodeString(address: string): Uint8Array {
    const bytes = Uint8Array.from(base58.decode(address));
    if (bytes.length < 25) {
      throw new Error('Invalid address length: ' + address);
    }

    const hash = bytes.slice(0, 21);
    const checksum = nobleSha256(nobleSha256(hash));

    if (
      checksum[0] !== bytes[21] ||
      checksum[1] !== bytes[22] ||
      checksum[2] !== bytes[23] ||
      checksum[3] !== bytes[24]
    ) {
      throw new Error('Checksum validation failed! ' + address);
    }

    return hash;
  }
}

export default Address;
