import { randomBytes as nobleRandomBytes } from '@noble/hashes/utils';
import bigInt from 'big-integer';

/**
 * 生成指定范围内的随机大整数
 * @param {BigInteger} limit - 上限值（不包含）
 * @returns {BigInteger} 返回 [1, limit-1] 范围内的随机大整数
 */
export function getBigRandom(limit) {
  const bitLen = limit.toString(2).length;
  const byteLen = Math.ceil(bitLen / 8);
  const bytes = new Uint8Array(byteLen);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLen; i++)
      bytes[i] = Math.floor(Math.random() * 256);
  }
  const rnd = bigInt(
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    16
  );
  return rnd.mod(limit.subtract(bigInt.one)).add(bigInt.one);
}

/**
 * 验证私钥是否在有效范围内
 * @param {BigInteger} privateKey - 私钥
 * @param {BigInteger} limit - 上限值（通常是曲线的阶）
 * @returns {boolean} 返回是否有效
 */
export function isValidPrivateKey(privateKey, limit) {
  return privateKey.greater(bigInt(0)) && privateKey.lesser(limit);
}

/**
 * 生成指定长度的随机字节数组
 * @param {number} length - 字节长度
 * @returns {Uint8Array} 返回随机字节数组
 */
export function generateRandomBytes(length) {
  try {
    // 优先使用 @noble/hashes 的 randomBytes
    return nobleRandomBytes(length);
  } catch (error) {
    // 降级方案
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomBytesArray = new Uint8Array(length);
      crypto.getRandomValues(randomBytesArray);
      return randomBytesArray;
    }

    // 最后的降级方案
    console.warn(
      'Warning: Using Math.random for random bytes generation. This is not cryptographically secure.'
    );
    const randomBytesArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      randomBytesArray[i] = Math.floor(Math.random() * 256);
    }
    return randomBytesArray;
  }
}

/**
 * 生成指定范围内的随机整数（适用于小范围）
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @returns {number} 返回随机整数
 */
export function getRandomInt(min, max) {
  try {
    // 使用 @noble/hashes 生成随机字节
    const bytes = nobleRandomBytes(4);
    const randomValue = new DataView(bytes.buffer).getUint32(0, false);
    return min + (randomValue % (max - min + 1));
  } catch (error) {
    // 降级方案
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return min + (array[0] % (max - min + 1));
    }

    // 最后的降级方案
    console.warn(
      'Warning: Using Math.random for random integer generation. This is not cryptographically secure.'
    );
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
