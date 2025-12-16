// Type definitions for biginteger.js

declare module '@/background/utils/biginteger' {
  class BigInteger {
    // 构造函数
    constructor(a?: any, b?: any, c?: any);

    // 静态方法
    static fromByteArrayUnsigned(ba: number[]): BigInteger;
    static fromByteArraySigned(ba: number[]): BigInteger;
    static fromNumber(n: number): BigInteger;
    static fromString(s: string, radix?: number): BigInteger;
    static valueOf(n: number): BigInteger;

    // 常量
    static ZERO: BigInteger;
    static ONE: BigInteger;
    static TWO: BigInteger;

    // 实例方法
    toByteArrayUnsigned(): number[];
    toByteArraySigned(): number[];
    toString(radix?: number): string;
    toNumber(): number;
    intValue(): number;
    byteValue(): number;
    shortValue(): number;
    longValue(): number;
    floatValue(): number;
    doubleValue(): number;
    add(a: BigInteger): BigInteger;
    subtract(a: BigInteger): BigInteger;
    multiply(a: BigInteger): BigInteger;
    divide(a: BigInteger): BigInteger;
    mod(a: BigInteger): BigInteger;
    modPow(e: BigInteger, m: BigInteger): BigInteger;
    modInverse(m: BigInteger): BigInteger;
    pow(e: number): BigInteger;
    gcd(a: BigInteger): BigInteger;
    abs(): BigInteger;
    negate(): BigInteger;
    compareTo(a: BigInteger): number;
    equals(a: any): boolean;
    isZero(): boolean;
    isNegative(): boolean;
    isPositive(): boolean;
    isProbablePrime(t: number): boolean;
    bitLength(): number;
    bitCount(): number;
    testBit(n: number): boolean;
    setBit(n: number): BigInteger;
    clearBit(n: number): BigInteger;
    flipBit(n: number): BigInteger;
    shiftLeft(n: number): BigInteger;
    shiftRight(n: number): BigInteger;
    and(a: BigInteger): BigInteger;
    or(a: BigInteger): BigInteger;
    xor(a: BigInteger): BigInteger;
    not(): BigInteger;
    andNot(a: BigInteger): BigInteger;
    min(a: BigInteger): BigInteger;
    max(a: BigInteger): BigInteger;
    square(): BigInteger;
    squareTo(r: any): void;
    multiplyTo(a: any, r: any): void;
    divRemTo(a: any, q: any, r: any): void;
    clone(): BigInteger;
    signum(): number;
  }

  // 导出其他类
  class Classic {
    constructor(m: any);
    convert(x: any): any;
    revert(x: any): any;
    reduce(x: any): any;
    mulTo(x: any, y: any, r: any): void;
    sqrTo(x: any, r: any): void;
  }

  class Montgomery {
    constructor(m: any);
    convert(x: any): any;
    revert(x: any): any;
    reduce(x: any): any;
    mulTo(x: any, y: any, r: any): void;
    sqrTo(x: any, r: any): void;
  }

  class NullExp {
    convert(x: any): any;
    revert(x: any): any;
    mulTo(x: any, y: any, r: any): void;
    sqrTo(x: any, r: any): void;
  }

  class Barrett {
    constructor(m: any);
    convert(x: any): any;
    revert(x: any): any;
    reduce(x: any): void;
    mulTo(x: any, y: any, r: any): void;
    sqrTo(x: any, r: any): void;
  }

  // 导出所有类型
  export {
    BigInteger,
    Classic,
    Montgomery,
    NullExp,
    Barrett
  };

  export default BigInteger;
}
