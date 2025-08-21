// 测试 hexToBytes 方法实现是否与原始方法一致

// 原始实现
function originalHexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

// 新实现
function newHexToBytes(hex) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

// bytesToHex 实现 (Array.from 方式)
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// 测试用例
const testCases = [
  '00',
  'FF',
  '1234',
  'ABCD',
  '1234567890ABCDEF',
  '000102030405060708090A0B0C0D0E0F',
];

console.log('=== hexToBytes 实现一致性测试 ===\n');

testCases.forEach((testCase) => {
  const originalResult = originalHexToBytes(testCase);
  const newResult = newHexToBytes(testCase);

  console.log(`测试: "${testCase}"`);
  console.log(`原始结果: [${originalResult.join(', ')}]`);
  console.log(`新结果:   [${newResult.join(', ')}]`);
  console.log(
    `一致性:   ${JSON.stringify(originalResult) === JSON.stringify(newResult) ? '✅ 通过' : '❌ 失败'}`
  );
  console.log('');
});

// 边界情况测试
console.log('=== 边界情况测试 ===\n');

// 空字符串
console.log('空字符串测试:');
console.log('原始结果:', originalHexToBytes(''));
console.log('新结果:  ', newHexToBytes(''));
console.log('');

// 奇数长度字符串
console.log('奇数长度字符串测试:');
try {
  console.log('原始结果:', originalHexToBytes('123'));
} catch (e) {
  console.log('原始结果: 抛出异常 -', e.message);
}

try {
  console.log('新结果:  ', newHexToBytes('123'));
} catch (e) {
  console.log('新结果:   抛出异常 -', e.message);
}
console.log('');

// 新增：bytesToHex 与 hexToBytes 一致性测试
console.log('=== bytesToHex 与 hexToBytes 一致性测试 ===\n');

// 测试字节数组转十六进制，再转回字节数组是否一致
const byteTestCases = [
  [0],
  [255],
  [18, 52],
  [171, 205],
  [18, 52, 86, 120, 144, 171, 205, 239],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
];

byteTestCases.forEach((bytes, index) => {
  // 使用 bytesToHex 转换为十六进制
  const hexString = bytesToHex(bytes);

  // 使用 hexToBytes 转换回字节数组
  const backToBytes = newHexToBytes(hexString);

  console.log(`测试 ${index + 1}: [${bytes.join(', ')}]`);
  console.log(`bytesToHex 结果: "${hexString}"`);
  console.log(`hexToBytes 结果: [${backToBytes.join(', ')}]`);
  console.log(
    `一致性: ${JSON.stringify(bytes) === JSON.stringify(backToBytes) ? '✅ 通过' : '❌ 失败'}`
  );
  console.log('');
});

// 测试版本字节和哈希字节的场景
console.log('=== 实际应用场景测试 ===\n');

// 模拟 getAddressHex 的场景
const version = 0x00; // mainnet address version
const mockHash = [18, 52, 86, 120, 144, 171, 205, 239]; // 模拟公钥哈希

console.log('版本字节测试:');
const versionHex = bytesToHex([version]);
console.log(`版本字节: [${version}]`);
console.log(`转换为十六进制: "${versionHex}"`);
console.log(`转换回字节: [${newHexToBytes(versionHex).join(', ')}]`);
console.log(
  `一致性: ${version === newHexToBytes(versionHex)[0] ? '✅ 通过' : '❌ 失败'}`
);
console.log('');

console.log('哈希字节测试:');
const hashHex = bytesToHex(mockHash);
console.log(`哈希字节: [${mockHash.join(', ')}]`);
console.log(`转换为十六进制: "${hashHex}"`);
console.log(`转换回字节: [${newHexToBytes(hashHex).join(', ')}]`);
console.log(
  `一致性: ${JSON.stringify(mockHash) === JSON.stringify(newHexToBytes(hashHex)) ? '✅ 通过' : '❌ 失败'}`
);
console.log('');

console.log('完整地址十六进制测试:');
const fullAddressHex = versionHex + hashHex;
console.log(`完整地址十六进制: "${fullAddressHex}"`);
console.log(`版本部分: "${versionHex}"`);
console.log(`哈希部分: "${hashHex}"`);
console.log('');

// 性能测试
console.log('=== 性能测试 ===\n');
const largeHex = '1234567890ABCDEF'.repeat(1000); // 16000 字符

const start1 = Date.now();
for (let i = 0; i < 1000; i++) {
  originalHexToBytes(largeHex);
}
const time1 = Date.now() - start1;

const start2 = Date.now();
for (let i = 0; i < 1000; i++) {
  newHexToBytes(largeHex);
}
const time2 = Date.now() - start2;

console.log(`原始实现耗时: ${time1}ms`);
console.log(`新实现耗时:   ${time2}ms`);
console.log(`性能差异:     ${(((time2 - time1) / time1) * 100).toFixed(2)}%`);

// bytesToHex 性能测试
const largeBytes = new Array(8000).fill(0).map((_, i) => i % 256);
const start3 = Date.now();
for (let i = 0; i < 1000; i++) {
  bytesToHex(largeBytes);
}
const time3 = Date.now() - start3;

console.log(`bytesToHex 耗时: ${time3}ms`);

console.log('\n=== 测试完成 ===');
