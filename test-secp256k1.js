// 测试 secp256k1 公钥生成
import { getSECCurveByName } from './src/shared/ecdsa.js';
import bigInt from 'big-integer';

const privateKeyHex = '2d1909cc50df105d75d5c7e931d98b4cbc77c06c489e8a526d57b8e9a1ff156d';
const privateKey = bigInt(privateKeyHex, 16);

console.log('=== 测试 secp256k1 公钥生成 ===');
console.log('私钥 (hex):', privateKeyHex);
console.log('私钥 (BigInteger):', privateKey.toString());

try {
  const secp256k1 = getSECCurveByName('secp256k1');
  console.log('secp256k1 曲线获取成功');
  
  const pubPoint = secp256k1.getG().multiply(privateKey);
  console.log('公钥点计算成功');
  
  // 获取压缩公钥
  const compressedPubKey = pubPoint.getEncoded(1);
  console.log('压缩公钥长度:', compressedPubKey.length);
  console.log('压缩公钥:', Array.from(compressedPubKey).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  // 获取非压缩公钥
  const uncompressedPubKey = pubPoint.getEncoded(0);
  console.log('非压缩公钥长度:', uncompressedPubKey.length);
  console.log('非压缩公钥:', Array.from(uncompressedPubKey).map(b => b.toString(16).padStart(2, '0')).join(''));
  
} catch (error) {
  console.error('secp256k1 计算失败:', error);
  console.error('错误堆栈:', error.stack);
}
