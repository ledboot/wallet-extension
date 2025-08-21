// 全局类型声明
declare global {
  // 为 Node.js 环境提供 global 对象
  const global: typeof globalThis;
}

// 为 browser-passworder 添加类型声明
declare module 'browser-passworder' {
  interface Encryptor {
    encrypt(password: string, data: any): Promise<string>;
    decrypt(password: string, encryptedData: string): Promise<any>;
  }

  const encryptor: Encryptor;
  export default encryptor;
}

export {};
