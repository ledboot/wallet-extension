declare module '@/shared/ecdsa.js' {
  import bigi from 'bigi';

  export interface FieldElementFp {
    toBigInteger(): bigi.BigInteger;
  }

  export interface PointFp {
    getX(): FieldElementFp;
    getY(): FieldElementFp;
    add(point: PointFp): PointFp;
    multiply(k: bigi.BigInteger): PointFp;
    isOnCurve(): boolean;
    toString(): string;
    getEncoded(compressed: number): Uint8Array;
  }

  export interface CurveFp {
    getQ(): bigi.BigInteger;
    getA(): FieldElementFp;
    getB(): FieldElementFp;
    fromBigInteger(x: bigi.BigInteger): FieldElementFp;
  }

  export interface X9Parameters {
    getCurve(): CurveFp;
    getG(): PointFp;
    getN(): bigi.BigInteger;
    getH(): bigi.BigInteger;
  }

  export interface SecNamedCurves {
    [key: string]: X9Parameters;
  }

  export function getSECCurveByName(name: string): X9Parameters;
  export function fromHex(hex: string): bigi.BigInteger;
  export function integerToBytes(
    value: bigi.BigInteger,
    length: number
  ): number[];

  const ecdsa: {
    getSECCurveByName: typeof getSECCurveByName;
    fromHex: typeof fromHex;
    integerToBytes: typeof integerToBytes;
  };

  export default ecdsa;
}
