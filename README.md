# ZENT Wallet Extension

_Read this in other languages: [中文](README_CN.md)._

ZENT Wallet Extension is a modern cryptocurrency wallet application based on Chrome Extensions. The project is built using the latest React 19, Tailwind CSS 4, and Vite toolchain, utilizing Zustand for data state management. It provides a comprehensive verification and isolation protection mechanism from the underlying Keyring to the front-end view to ensure high security.

## 🌟 Core Features

Important modules currently implemented in the project:

- **Modern UI Interaction Design System**: Borderless, rounded visual design with lightweight animations; built-in exclusive generative avatars (PixelAvatar) to enhance brand identity.
- **Asset Overview Calculation**: Asset aggregation statistics, individual token status, and transaction details visualization.
- **Asset Operational Flow**: Provides an encrypted signature-authenticated "Receive" page and a "Send" asset pipeline (transaction amount filtering and on-chain operation confirmation).
- **Wallet State & Identity Control**: Unlock authentication interception mechanism, complete configurations, password update protection, adjustable account details mechanism, and even a local account management and clearing function.
- **Network Adaptive Regulation**: Configures and previews multiple network environments, supporting custom RPC network detailed state management through its own interactions.
- **Web3 Communication Bridge**: Highly reliable `content script` that smoothly integrates and connects wallet operations with Web DApps.

## 🛠 Initialization & Installation

This project utilizes `pnpm` as the package management strategy to optimize the performance and stability of dependency resolution. A `Node.js >= 20` development environment is required.

### 1. Development Preparation

```bash
# Fetch and configure all corresponding dependency libraries
pnpm install

# Start Vite and other development servers with watch and hot reload by default.
pnpm run dev
```

### 2. Production Build Strategy

If you wish to compile a distribution artifact capable of being submitted to the Chrome Web Store or properly loaded at the production level, please execute the build command:

```bash
pnpm run build
```

The final result of an optimized build will be packaged and automatically outputted into the `dist/` root directory. Subsequently, you can load the `dist/` directory locally as an "unpacked extension" via Chrome's extensions management page (`chrome://extensions/`).

## 📂 Project Structure Overview

The main business logic is modularized within the `src` folder.

- `src/ui/`: Hosts all the front-end Web application architecture code. Using a feature-driven model, it is divided into `pages` (grouped by features like `account`, `main`, `settings`, `wallet`) alongside their corresponding `components` library.
- `src/background/`: Contains the Service Worker execution mechanism responsible for maintaining continuous background responses and storage services.
- `src/content_scripts/`: Core gateway relay script files, responsible for real-time application bridge mounting when the user interacts with relevant external DApps.
- `src/shared/`: A shared repository for common configurations, helper functions, and standard constant definitions.

## 🎯 Todo / Future Architectural Improvements

- More detailed advanced application configuration capabilities.
- Local on-chain Index data fetch optimization and caching mechanism.
