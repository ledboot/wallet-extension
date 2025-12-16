import { BigInteger } from 'jsbn';

declare module 'ecurve' {
  export interface FieldElementFp {
    toBigInteger(): BigInteger;
  }

  export interface PointFp {
    [x: string]: any;
    x: FieldElementFp;
    y: FieldElementFp;
    z: FieldElementFp;
    curve: any;
    zInv: any;
    getX(): FieldElementFp;
    getY(): FieldElementFp;
    add(b: PointFp): PointFp;
    multiply(k: BigInteger): PointFp;
    isInfinity(): boolean;
    isOnCurve(): boolean;
    toString(): string;
    getEncoded(compressed: boolean): Buffer;
    equals(other: PointFp): boolean;
    negate(): PointFp;
    twice(): PointFp;
    multiplyTwo(j: BigInteger, x: PointFp, k: BigInteger): PointFp;
  }

  export interface CurveFp {
    p: BigInteger;
    a: BigInteger;
    b: BigInteger;
    G: PointFp;
    n: BigInteger;
    h: BigInteger;
    decodePointHex(hex: string): PointFp;
  }

  export function getCurveByName(name: string): CurveFp;
}
