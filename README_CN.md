# ZENT Wallet Extension

_其他语言版本: [English](README.md)._

ZENT Wallet Extension 是一款基于 Chrome Extension 的现代化加密货币钱包应用。项目采用了最新的 React 19、Tailwind CSS 4 和 Vite 工具链构建，使用 Zustand 进行数据状态管理，并在安全上提供了从底层 Keyring 到前端视图的完善验证隔离保护机制。

## 🌟 核心特性 (Features)

目前项目已经实现的重要模块：

- **现代 UI 交互设计系统**: 无边框圆角视觉设计和轻量化动画；内建专属的生成头像（PixelAvatar）增强品牌识别度。
- **资产概览计算**: 资产聚合统计及单币种状态和交易细节可视化。
- **资产操作流**: 提供加密签名认证的“接收”页面支持和“发送”资产链路（交易金额筛选及链上操作确认）。
- **钱包状态与身份控制**: 解锁鉴权拦截机制、完整的配置、密码更新保护、可调整账户详情机制甚至本地账号管理清除功能。
- **网络自适应调控**: 配置并预览多网络环境，通过自有的交互进行定制 RPC 网络细节状态管理。
- **Web3 通讯桥接**: 高度可靠的 `content script` 将钱包操作与 Web DApp 平滑融合串联。

## 🛠 初始化与安装 (Installation)

本项目采用了 `pnpm` 作为包管理策略以增加依赖管理的性能与稳定性。并要求 `Node.js >= 20` 的开发工作环境。

### 1. 开发阶段准备

```bash
# 获取并配置对应所有的依赖库资源
pnpm install

# 默认会以 watch 和 hot reload 方式启动 Vite 等开发服务器。
pnpm run dev
```

### 2. 生产环境构建策略

如果你希望编译出能在 Chrome 应用商店或在生产级别加载的分发产物，请运行安全和压缩逻辑指令：

```bash
pnpm run build
```

所有合规构建的最终结果将打包在自动输出的 `dist/` 根目录里，随后你可将 `dist/` 目录从 chrome 开发者中心打包引入本地作为扩展启动项。

## 📂 项目结构概览

主要业务代码拆分在 `src` 文件夹中执行解耦管理。

- `src/ui/`: 承载所有的前端 Web 应用层架构代码。利用功能树模型分为 `pages`（如 `account`, `main`, `settings`, `wallet` 等功能聚合），以及对应的 `components` 组件库。
- `src/background/`: 存放负责长时间维持后台响应及存储服务的 Service worker 执行机制。
- `src/content_scripts/`: 核心网关中转脚本文件，在用户打开相关外部 DApp 的时候实时负责挂载对象通讯。
- `src/shared/`: 公用配置与提取代码、规范常量模块共享仓库。

## 🎯 Todo / 后期改进架构方向

- 更多详细的高级应用配置能力。
- 本地链上 Index 数据优化获取缓存机制。
