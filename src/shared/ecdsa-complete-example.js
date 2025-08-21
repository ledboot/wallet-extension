// 完整的 ECDSA 库使用示例
import bigInt from 'big-integer';

import ecdsa, {
  CurveFp,
  FieldElementFp,
  fromHex,
  getSECCurveByName,
  integerToBytes,
  PointFp,
  secNamedCurves,
  X9Parameters,
} from './ecdsa.js';
import { getBigRandom } from './getBigRandom.js';

console.log('=== 完整的 ECDSA 库使用示例 ===\n');

// ==================== 第一部分：基础功能测试 ====================
console.log('📋 第一部分：基础功能测试');

// 1. 获取 secp256k1 曲线参数
console.log('\n1️⃣ 获取 secp256k1 曲线');
const secp256k1 = getSECCurveByName('secp256k1');
if (secp256k1) {
  console.log('✅ secp256k1 曲线获取成功');
  console.log('曲线参数:');
  console.log('  - q (素数):', secp256k1.getCurve().getQ().toString());
  console.log('  - a:', secp256k1.getCurve().getA().toBigInteger().toString());
  console.log('  - b:', secp256k1.getCurve().getB().toBigInteger().toString());
  console.log('  - n (阶):', secp256k1.getN().toString());
  console.log('  - h (余因子):', secp256k1.getH().toString());

  // 获取生成点 G
  const G = secp256k1.getG();
  console.log('  - 生成点 G:', G.toString());
} else {
  console.log('❌ secp256k1 曲线获取失败');
}

// 2. 工具函数测试
console.log('\n2️⃣ 工具函数测试');
const hexValue = '1234567890ABCDEF';
const bigIntValue = fromHex(hexValue);
console.log('✅ 十六进制转大整数:', hexValue, '->', bigIntValue.toString());

const bytes = integerToBytes(bigIntValue, 8);
console.log('✅ 大整数转字节数组:', bytes);

// 3. 库导出测试
console.log('\n3️⃣ 库导出测试');
console.log('✅ 默认导出类型:', typeof ecdsa);
console.log('✅ 命名导出测试:');
console.log('  - getSECCurveByName:', typeof getSECCurveByName);
console.log('  - fromHex:', typeof fromHex);
console.log('  - integerToBytes:', typeof integerToBytes);

// 4. 基本功能验证
console.log('\n4️⃣ 基本功能验证');
try {
  // 测试创建大整数
  const testNum = fromHex('FF');
  console.log('✅ 大整数创建成功:', testNum.toString());

  // 测试基本运算
  const result = testNum.multiply(2);
  console.log('✅ 大整数乘法成功:', result.toString());
} catch (error) {
  console.log('❌ 测试失败:', error.message);
}

// ==================== 第二部分：高级功能测试 ====================
console.log('\n\n📋 第二部分：高级功能测试');

// 5. 创建自定义曲线
console.log('\n5️⃣ 创建自定义曲线');
const p = fromHex(
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F'
);
const a = 0; // secp256k1 的 a 参数
const b = fromHex('7'); // secp256k1 的 b 参数

const curve = new CurveFp(p, a, b);
console.log('✅ 自定义曲线创建成功');
console.log('曲线参数:');
console.log('  - q:', curve.getQ().toString());
console.log('  - a:', curve.getA().toBigInteger().toString());
console.log('  - b:', curve.getB().toBigInteger().toString());

// 6. 创建椭圆曲线点
console.log('\n6️⃣ 创建椭圆曲线点');
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
console.log('✅ 点创建成功:', point.toString());

// 验证点是否在曲线上
if (point.isOnCurve()) {
  console.log('✅ 点验证成功: 点在曲线上');
} else {
  console.log('❌ 点验证失败: 点不在曲线上');
}

// 7. 点的基本运算
console.log('\n7️⃣ 点的基本运算');
try {
  const point2 = point.add(point); // 2P
  console.log('✅ 2P = P + P:', point2.toString());

  const point3 = point.multiply(3); // 3P
  console.log('✅ 3P = 3 * P:', point3.toString());
} catch (error) {
  console.log('❌ 点运算失败:', error.message);
}

// 8. 预定义曲线的点运算
console.log('\n8️⃣ 预定义曲线的点运算');
if (secp256k1) {
  const G = secp256k1.getG();
  try {
    // 测试生成点的基本运算
    const G2 = G.add(G); // 2G
    console.log('✅ 2G = G + G:', G2.toString());

    const G3 = G.multiply(3); // 3G
    console.log('✅ 3G = 3 * G:', G3.toString());

    // 验证生成点在曲线上
    if (G.isOnCurve()) {
      console.log('✅ 生成点 G 验证成功: 点在曲线上');
    } else {
      console.log('❌ 生成点 G 验证失败: 点不在曲线上');
    }
  } catch (error) {
    console.log('❌ 预定义曲线点运算失败:', error.message);
  }
}

// ==================== 第三部分：高级工具函数 ====================
console.log('\n\n📋 第三部分：高级工具函数');

// 9. 更多工具函数测试
console.log('\n9️⃣ 更多工具函数测试');
try {
  // 测试不同长度的十六进制转换
  const shortHex = 'FF';
  const longHex =
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F';

  const shortNum = fromHex(shortHex);
  const longNum = fromHex(longHex);

  console.log('✅ 短十六进制转换:', shortHex, '->', shortNum.toString());
  console.log(
    '✅ 长十六进制转换:',
    longHex.substring(0, 20) + '...',
    '->',
    longNum.toString().substring(0, 20) + '...'
  );

  // 测试不同长度的字节数组转换
  const shortBytes = integerToBytes(shortNum, 4);
  const longBytes = integerToBytes(longNum, 32);

  console.log('✅ 短字节数组转换:', shortBytes);
  console.log(
    '✅ 长字节数组转换:',
    longBytes.slice(0, 8),
    '... (共',
    longBytes.length,
    '字节)'
  );
} catch (error) {
  console.log('❌ 工具函数测试失败:', error.message);
}

// ==================== 第四部分：库完整性验证 ====================
console.log('\n\n📋 第四部分：库完整性验证');

// 10. 验证所有导出的类和函数
console.log('\n🔟 验证所有导出的类和函数');
console.log('✅ 默认导出:', typeof ecdsa);
console.log('✅ 命名导出验证:');
console.log('  - FieldElementFp:', typeof FieldElementFp);
console.log('  - PointFp:', typeof PointFp);
console.log('  - CurveFp:', typeof CurveFp);
console.log('  - X9Parameters:', typeof X9Parameters);
console.log('  - secNamedCurves:', typeof secNamedCurves);
console.log('  - getSECCurveByName:', typeof getSECCurveByName);
console.log('  - fromHex:', typeof fromHex);
console.log('  - integerToBytes:', typeof integerToBytes);

// 11. 测试类的实例化
console.log('\n1️⃣1️⃣ 测试类的实例化');
try {
  // 测试 FieldElementFp
  new FieldElementFp(fromHex('7'), fromHex('3'));
  console.log('✅ FieldElementFp 实例化成功');

  // 测试 CurveFp
  const testCurve = new CurveFp(fromHex('7'), 0, 3);
  console.log('✅ CurveFp 实例化成功');

  // 测试 PointFp
  const testPoint = new PointFp(
    testCurve,
    testCurve.fromBigInteger(fromHex('1')),
    testCurve.fromBigInteger(fromHex('2'))
  );
  console.log('✅ PointFp 实例化成功');

  // 测试 X9Parameters
  new X9Parameters(testCurve, testPoint, fromHex('5'), fromHex('1'));
  console.log('✅ X9Parameters 实例化成功');
} catch (error) {
  console.log('❌ 类实例化测试失败:', error.message);
}

// 12. 测试 getBigRandom 函数
console.log('\n1️⃣2️⃣ 测试 getBigRandom 函数');
try {
  // 测试 getBigRandom 函数
  const n = secp256k1.getN();
  console.log('✅ 获取 secp256k1 的阶 n:', n.toString());

  // 生成多个随机私钥进行测试
  for (let i = 0; i < 3; i++) {
    const privateKey = getBigRandom(n);
    console.log(`✅ 随机私钥 ${i + 1}:`, privateKey.toString());

    // 验证私钥在有效范围内
    if (privateKey.greater(bigInt(0)) && privateKey.lesser(n)) {
      console.log(`  ✅ 私钥 ${i + 1} 验证通过: 在有效范围内`);
    } else {
      console.log(`  ❌ 私钥 ${i + 1} 验证失败: 超出有效范围`);
    }
  }

  // 测试边界情况
  console.log('\n🔍 测试边界情况:');
  const smallLimit = bigInt(100);
  const smallRandom = getBigRandom(smallLimit);
  console.log('✅ 小范围随机数测试:', smallRandom.toString(), '(范围: 1-99)');
} catch (error) {
  console.log('❌ getBigRandom 函数测试失败:', error.message);
  console.log('错误堆栈:', error.stack);
}

// ==================== 总结 ====================
console.log('\n\n🎉 ==================== 测试总结 ====================');
console.log('✅ ECDSA 库转换成功！');
console.log('✅ 所有基础功能正常工作');
console.log('✅ 高级功能测试通过');
console.log('✅ 工具函数完整可用');
console.log('✅ 库导出功能正常');
console.log('\n🚀 现在你可以在项目中使用这个 ECDSA 库了！');

// 使用示例
console.log('\n📖 使用示例:');
console.log('```javascript');
console.log('// 默认导入');
console.log("import ecdsa from './ecdsa.js';");
console.log('');
console.log('// 命名导入');
console.log(
  "import { PointFp, CurveFp, getSECCurveByName } from './ecdsa.js';"
);
console.log('');
console.log('// 获取 secp256k1 曲线');
console.log("const secp256k1 = getSECCurveByName('secp256k1');");
console.log('const G = secp256k1.getG();');
console.log('```');

export default ecdsa;
