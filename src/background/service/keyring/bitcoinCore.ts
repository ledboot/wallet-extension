import type { ECPairInterface } from 'ecpair';

let bitcoinCoreCache: {
  ECPair: any;
  bitcoin: any;
  ecc: any;
} | null = null;

/**
 * 动态加载 Bitcoin 库以避免在 Service Worker 中的顶层 await 问题
 */
async function loadBitcoinCore() {
  if (bitcoinCoreCache) {
    return bitcoinCoreCache;
  }

  // 使用动态导入来加载 WebAssembly 相关的库
  const [bitcoinModule, ECPairFactoryModule, eccModule] = await Promise.all([
    import('bitcoinjs-lib'),
    import('ecpair'),
    import('tiny-secp256k1'),
  ]);

  const bitcoin = bitcoinModule.default || bitcoinModule;
  const ECPairFactory =
    ECPairFactoryModule.default || ECPairFactoryModule.default;
  const ecc = eccModule;

  // 初始化 ECC 库
  bitcoin.initEccLib(ecc);
  const ECPair = ECPairFactory(ecc);

  bitcoinCoreCache = { ECPair, bitcoin, ecc };
  return bitcoinCoreCache;
}

export { loadBitcoinCore, type ECPairInterface };
