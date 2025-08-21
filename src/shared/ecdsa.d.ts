declare module '@/shared/ecdsa.js' {
  import bigInt from 'big-integer';

  export interface FieldElementFp {
    toBigInteger(): bigInt.BigInteger;
  }

  export interface PointFp {
    getX(): FieldElementFp;
    getY(): FieldElementFp;
    add(point: PointFp): PointFp;
    multiply(k: bigInt.BigInteger): PointFp;
    isOnCurve(): boolean;
    toString(): string;
    getEncoded(compressed: number): Uint8Array;
  }

  export interface CurveFp {
    getQ(): bigInt.BigInteger;
    getA(): FieldElementFp;
    getB(): FieldElementFp;
    fromBigInteger(x: bigInt.BigInteger): FieldElementFp;
  }

  export interface X9Parameters {
    getCurve(): CurveFp;
    getG(): PointFp;
    getN(): bigInt.BigInteger;
    getH(): bigInt.BigInteger;
  }

  export interface SecNamedCurves {
    [key: string]: X9Parameters;
  }

  export function getSECCurveByName(name: string): X9Parameters;
  export function fromHex(hex: string): bigInt.BigInteger;
  export function integerToBytes(
    value: bigInt.BigInteger,
    length: number
  ): number[];

  const ecdsa: {
    getSECCurveByName: typeof getSECCurveByName;
    fromHex: typeof fromHex;
    integerToBytes: typeof integerToBytes;
  };

  export default ecdsa;
}
