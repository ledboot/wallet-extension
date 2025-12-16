import { getCurveByName } from 'ecurve';
import { BigInteger } from 'jsbn';
import SHA256 from 'crypto-js/sha256';
import CryptoJS from 'crypto-js';

export class ECDS {
  private static readonly curve = getCurveByName('secp256k1');
  private static readonly n = new BigInteger(this.curve.n.toString(16), 16);
  private static readonly G = this.curve.G;
  private static readonly nDiv2 = this.n.shiftRight(1);

  /**
   * Sign a message hash with a private key
   * @param messageHash - The message hash to sign (hex string)
   * @param privateKey - The private key (hex string or BigInteger)
   * @returns The signature as a hex string
   */
  public static sign(messageHash: string, privateKey: string | BigInteger): string {
    const e = new BigInteger(messageHash, 16);
    const d = typeof privateKey === 'string' ? new BigInteger(privateKey, 16) : privateKey;
    
    // Generate a deterministic k value (RFC 6979)
    const k = this.deterministicGenerateK(messageHash, d);
    
    // Calculate r = (k * G).x mod n
    const R = this.G.multiply(k);
    let r = R.affineX.toBigInteger().mod(this.n);
    
    // Calculate s = k^-1 (e + r*d) mod n
    const s = k.modInverse(this.n).multiply(e.add(d.multiply(r))).mod(this.n);
    
    // Use low-s value to prevent signature malleability
    const sNormalized = s.compareTo(this.nDiv2) > 0 ? this.n.subtract(s) : s;
    
    // Encode as DER
    return this.serializeSig(r, sNormalized);
  }

  /**
   * Verify a signature
   * @param messageHash - The original message hash that was signed (hex string)
   * @param signature - The signature to verify (hex string or DER encoded)
   * @param publicKey - The public key (hex string or ECPointFp)
   * @returns boolean indicating if the signature is valid
   */
  public static verify(messageHash: string, signature: string, publicKey: string | any): boolean {
    try {
      const e = new BigInteger(messageHash, 16);
      const { r, s } = this.parseSig(signature);
      
      // Verify r and s are in [1, n-1]
      if (r.compareTo(BigInteger.ONE) < 0 || r.compareTo(this.n) >= 0 ||
          s.compareTo(BigInteger.ONE) < 0 || s.compareTo(this.n) >= 0) {
        return false;
      }
      
      const c = s.modInverse(this.n);
      const u1 = e.multiply(c).mod(this.n);
      const u2 = r.multiply(c).mod(this.n);
      
      const Q = typeof publicKey === 'string' ? 
        this.curve.decodePointHex(publicKey) : publicKey;
      
      const point = this.G.multiply(u1).add(Q.multiply(u2));
      if (point.isInfinity()) return false;
      
      const v = point.affineX.toBigInteger().mod(this.n);
      return v.equals(r);
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate a deterministic k value (RFC 6979)
   */
  private static deterministicGenerateK(messageHash: string, privateKey: BigInteger): BigInteger {
    // Simplified version - in production, use a proper RFC 6979 implementation
    // This is a basic example and not suitable for production use
    const hash = SHA256(messageHash + privateKey.toString(16)).toString();
    return new BigInteger(hash, 16).mod(this.n.subtract(BigInteger.ONE)).add(BigInteger.ONE);
  }

  /**
   * Serialize signature to DER format
   */
  private static serializeSig(r: BigInteger, s: BigInteger): string {
    const rBa = this.toDER(r);
    const sBa = this.toDER(s);
    
    const sequence: number[] = [];
    sequence.push(0x02);
    sequence.push(rBa.length);
    sequence.push(...rBa);
    sequence.push(0x02);
    sequence.push(sBa.length);
    sequence.push(...sBa);
    
    const der: number[] = [];
    der.push(0x30);
    der.push(sequence.length);
    der.push(...sequence);
    
    return Buffer.from(der).toString('hex');
  }

  /**
   * Parse DER encoded signature
   */
  private static parseSig(signature: string | number[]): { r: BigInteger; s: BigInteger } {
    let sig: number[];
    
    if (typeof signature === 'string') {
      sig = Array.from(Buffer.from(signature, 'hex'));
    } else {
      sig = signature;
    }
    
    // Skip sequence byte and length
    let pos = 2;
    
    // Read r
    pos++; // Skip 0x02
    const rLen = sig[pos++];
    const rBa = sig.slice(pos, pos + rLen);
    pos += rLen;
    
    // Read s
    pos++; // Skip 0x02
    const sLen = sig[pos++];
    const sBa = sig.slice(pos, pos + sLen);
    
    return {
      r: new BigInteger(Buffer.from(rBa).toString('hex'), 16),
      s: new BigInteger(Buffer.from(sBa).toString('hex'), 16)
    };
  }

  /**
   * Convert BigInteger to DER format
   */
  private static toDER(x: BigInteger): number[] {
    let hex = x.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    
    const bytes = Buffer.from(hex, 'hex');
    
    // Remove leading zeros
    let i = 0;
    while (i < bytes.length - 1 && bytes[i] === 0) {
      i++;
    }
    
    // If the first byte has its highest bit set, prepend a zero byte
    const result: number[] = [];
    if ((bytes[i] & 0x80) !== 0) {
      result.push(0x00);
    }
    
    result.push(...Array.from(bytes.slice(i)));
    return result;
  }
}

export default ECDS;
