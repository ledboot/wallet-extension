# ECDSA 椭圆曲线数字签名算法库

这是一个基于 JavaScript 的椭圆曲线数字签名算法（ECDSA）实现库，已从传统的 IIFE 格式转换为现代 ES6 模块格式。

## 功能特性

- 支持 secp256k1 椭圆曲线（比特币使用的曲线）
- 完整的椭圆曲线点运算（加法、乘法、倍乘等）
- 大整数运算支持
- 点的压缩和解压缩
- 点的验证功能
- 工具函数（十六进制转换、字节数组转换等）

## 安装依赖

确保项目中已安装 `big-integer` 依赖：

```bash
pnpm add big-integer
```

## 使用方法

### 1. 导入库

```javascript
// 默认导入
// 命名导入
import ecdsa, {
  CurveFp,
  FieldElementFp,
  fromHex,
  getSECCurveByName,
  integerToBytes,
  PointFp,
} from './ecdsa.js';
```

### 2. 获取预定义曲线

```javascript
// 获取 secp256k1 曲线
const secp256k1 = getSECCurveByName('secp256k1');
if (secp256k1) {
  const curve = secp256k1.getCurve();
  const G = secp256k1.getG(); // 生成点
  const n = secp256k1.getN(); // 阶
}
```

### 3. 创建自定义曲线

```javascript
import { CurveFp, fromHex } from './ecdsa.js';

const p = fromHex(
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F'
);
const a = 0; // secp256k1 的 a 参数
const b = fromHex('7'); // secp256k1 的 b 参数

const curve = new CurveFp(p, a, b);
```

### 4. 创建椭圆曲线点

```javascript
import { fromHex, PointFp } from './ecdsa.js';

const x = fromHex(
  '79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'
);
const y = fromHex(
  '483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8'
);

const point = new PointFp(
  curve,
  curve.fromBigInteger(x),
  curve.fromBigInteger(y)
);

// 验证点是否在曲线上
if (point.isOnCurve()) {
  console.log('点在曲线上');
}
```

### 5. 点的运算

```javascript
// 点加法
const point2 = point1.add(point2);

// 点倍乘
const point3 = point.multiply(3); // 3P

// 点倍乘（2D 版本）
const point4 = point.multiply2D(3);

// 同时倍乘
const result = point1.multiplyTwo(j, point2, k); // j*P1 + k*P2
```

### 6. 工具函数

```javascript
import { fromHex, integerToBytes } from './ecdsa.js';

// 十六进制转大整数
const bigInt = fromHex('1234567890ABCDEF');

// 大整数转字节数组
const bytes = integerToBytes(bigInt, 8);
```

### 7. 点的编码和解码

```javascript
// 获取压缩的公钥
const compressedKey = point.getEncoded(true);

// 获取未压缩的公钥
const uncompressedKey = point.getEncoded(false);

// 从字节数组解码点
const decodedPoint = PointFp.decodeFrom(curve, keyBytes);
```

### 8. 点的验证

```javascript
// 验证点是否有效
try {
  point.validate();
  console.log('点验证成功');
} catch (error) {
  console.log('点验证失败:', error.message);
}
```

## 主要类和函数

### FieldElementFp

有限域元素类，用于椭圆曲线上的坐标运算。

### PointFp

椭圆曲线点类，提供点的各种运算方法。

### CurveFp

椭圆曲线类，定义曲线的参数和基本操作。

### X9Parameters

X9 标准椭圆曲线参数类。

### 工具函数

- `getSECCurveByName(name)`: 获取预定义的椭圆曲线
- `fromHex(hexString)`: 十六进制字符串转大整数
- `integerToBytes(integer, length)`: 大整数转字节数组

## 注意事项

1. 该库依赖于 `big-integer` 包，确保已正确安装
2. 库中实现了简单的 `SecureRandom` 和 `Barrett` 类用于兼容性
3. 主要用于比特币相关的椭圆曲线运算
4. 支持点的压缩和未压缩格式

## 示例

查看 `ecdsa-example.js` 文件获取完整的使用示例。

## 许可证

原始代码版权归 Tom Wu 和 bitaddress.org 所有，使用 BSD 许可证。
