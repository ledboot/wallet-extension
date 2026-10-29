# ZENT 钱包接入示例

普通网页示例，无需 bun install，无需构建。需要安装并启用 ZENT Wallet Extension。

## 运行

在本目录运行：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

在安装了钱包的浏览器打开 `http://127.0.0.1:8080`。请使用测试账户和目标测试网络。
本地目录名、端口号不属于钱包协议，可以自行调整。

## 测试顺序

1. 在钱包内选择账户、网络，点击页面“连接钱包”并确认。
2. 点击查询，查看账户、网络、余额摘要和 UTXO。
3. 输入文本并签名，结果区域展示原文、地址和签名。
4. 粘贴真实完整交易 hex，模拟或签名，再单独点击广播。
5. 填入已部署合约地址、ABI 编码参数并查询。

交易和合约数据需要由你的 SmallC/交易工具生成，示例不会代替你编码交易。
任意示意 hex 无法当作真实交易测试。广播返回交易 hash 后，需要另行查询链上确认。

## 文件

- [index.html](index.html)：测试界面。
- [demo.js](demo.js)：原生 JavaScript 调用，无依赖。
- [zent-provider.ts](zent-provider.ts)：TypeScript 接口声明。
- [wallet-client.ts](wallet-client.ts)：TypeScript 检测、连接、上下文校验、签名和广播封装。

TypeScript 项目可把两个 `.ts` 文件复制到项目同一目录，用自己的构建工具编译。
原生网页直接使用 `demo.js`，不直接加载 `.ts` 文件。

完整参数、返回值和 SmallC 部署交易构造示例见
[第三方接入指南](../../third-party-wallet-integration.md)。
