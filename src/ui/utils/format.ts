/**
 * Formats a raw amount (in satoshis) to a human-readable string
 * @param value - The amount as a bigint or string
 * @returns Formatted amount string
 */
export const formatAmount = (value: bigint | string | number): string => {
  // 如果是字符串（从消息传递过来的），转换为 BigInt
  const bigIntValue = typeof value !== 'number' ? Number(value) : value;
  return (bigIntValue / 100000000).toFixed(8);
};
