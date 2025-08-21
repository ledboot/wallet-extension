declare module '@/shared/getBigRandom.js' {
  import bigInt from 'big-integer';

  export function getBigRandom(limit: bigInt.BigInteger): bigInt.BigInteger;
  export function isValidPrivateKey(
    privateKey: bigInt.BigInteger,
    limit: bigInt.BigInteger
  ): boolean;
  export function generateRandomBytes(length: number): Uint8Array;
  export function getRandomInt(min: number, max: number): number;
}
