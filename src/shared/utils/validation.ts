// 验证工具函数
export class ValidationUtils {
  // 验证以太坊地址格式
  static isValidEthereumAddress(address: string): boolean {
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  }

  // 验证私钥格式
  static isValidPrivateKey(privateKey: string): boolean {
    // 移除 0x 前缀
    const cleanKey = privateKey.startsWith('0x')
      ? privateKey.slice(2)
      : privateKey;
    // 私钥应该是 64 个十六进制字符
    const privateKeyRegex = /^[a-fA-F0-9]{64}$/;
    return privateKeyRegex.test(cleanKey);
  }

  // 验证密码强度
  static isStrongPassword(password: string): boolean {
    // 至少 8 个字符，包含大小写字母、数字和特殊字符
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  // 验证 SQL 注入
  static isSafeSQL(sql: string): boolean {
    // 检查是否包含危险的 SQL 关键字
    const dangerousKeywords = [
      'DROP',
      'DELETE',
      'TRUNCATE',
      'ALTER',
      'CREATE',
      'INSERT',
      'UPDATE',
    ];

    const upperSQL = sql.toUpperCase();
    return !dangerousKeywords.some(
      (keyword) =>
        upperSQL.includes(keyword) &&
        !upperSQL.includes(`CREATE TABLE`) &&
        !upperSQL.includes(`CREATE INDEX`)
    );
  }

  // 验证消息格式
  static isValidMessage(message: unknown): boolean {
    if (!message || typeof message !== 'object') {
      return false;
    }

    const msg = message as Record<string, unknown>;

    // 检查必需字段
    const requiredFields = ['id', 'timestamp', 'source', 'target', 'type'];
    for (const field of requiredFields) {
      if (!(field in msg)) {
        return false;
      }
    }

    // 验证时间戳
    if (typeof msg.timestamp !== 'number' || msg.timestamp <= 0) {
      return false;
    }

    // 验证来源和目标
    const validSources = ['popup', 'content', 'options', 'background'];
    if (
      !validSources.includes(msg.source as string) ||
      !validSources.includes(msg.target as string)
    ) {
      return false;
    }

    return true;
  }

  // 验证 UUID 格式
  static isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // 验证金额格式
  static isValidAmount(amount: string): boolean {
    // 检查是否为有效的数字字符串
    const amountRegex = /^\d+(\.\d+)?$/;
    if (!amountRegex.test(amount)) {
      return false;
    }

    // 检查是否为正数
    const numAmount = parseFloat(amount);
    return numAmount > 0 && isFinite(numAmount);
  }

  // 验证 Gas 价格
  static isValidGasPrice(gasPrice: string): boolean {
    return this.isValidAmount(gasPrice);
  }

  // 验证 Gas 限制
  static isValidGasLimit(gasLimit: string): boolean {
    const limit = parseInt(gasLimit, 10);
    return !isNaN(limit) && limit > 0 && limit <= 30000000; // 最大 30M gas
  }

  // 验证 Nonce
  static isValidNonce(nonce: number): boolean {
    return Number.isInteger(nonce) && nonce >= 0;
  }
}
