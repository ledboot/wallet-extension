# ANEX Wallet Extension

## Project Overview

ANEX Wallet is a secure, user-friendly browser extension for managing cryptocurrency assets. It provides a seamless interface for sending, receiving, and monitoring blockchain transactions while keeping private keys secure in the browser's secure storage.

## Technical Stack

- **Framework**: Browser Extension API
- **Language**: TypeScript
- **UI**: React with TypeScript
- **State Management**: Context API
- **Storage**: IndexedDB for wallet data
- **Cryptography**: Web Crypto API
- **Package Manager**: pnpm
- **Build Tool**: Webpack
- **Linting & Formatting**: ESLint, Prettier

## Project Structure

```
src/
├── background/           # Background scripts
│   ├── controller/      # Core wallet logic
│   └── service/         # External service integrations
├── ui/                  # User interface components
├── shared/              # Shared utilities and types
└── manifest.json        # Extension manifest
```

## Development Guidelines

### Prerequisites

- Node.js >= 16.0.0
- pnpm >= 7.0.0
- Chrome or Firefox for development

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

### Code Style

- TypeScript strict mode enabled
- 2 spaces for indentation
- Single quotes for strings
- Semicolons at the end of statements
- Max line length: 100 characters
- Always use explicit return types for functions

## Security Best Practices

### Key Management
- Private keys are never stored in plaintext
- Keys are encrypted before storage using Web Crypto API
- Sensitive operations are isolated in the background script

### Secure Communication
- Use `chrome.runtime.sendMessage` for cross-extension communication
- Validate all incoming messages
- Implement proper CORS policies
- Use Content Security Policy (CSP) headers

### Storage Security
- Store sensitive data in `chrome.storage.local` with encryption
- Never store private keys in `localStorage` or `sessionStorage`
- Implement proper data validation before storage

## Naming Conventions

### General Rules
- **PascalCase**: Components, Type definitions, Interfaces
- **camelCase**: Variables, functions, methods, hooks
- **UPPER_SNAKE_CASE**: Constants, environment variables
- **kebab-case**: File and directory names

### Specific Naming Patterns
- Event handlers: `handle` prefix (e.g., `handleSubmit`, `handleClick`)
- Boolean variables: `is`, `has`, `should` prefixes (e.g., `isLoading`, `hasError`)
- Custom hooks: `use` prefix (e.g., `useWallet`, `useBalance`)
- API services: `service` suffix (e.g., `transactionService`)

## State Management

### Wallet State
- Managed in the background script
- Persisted to IndexedDB
- Synced with the UI through message passing

### UI State
- Local component state for UI-specific data
- Context API for shared state between components
- Avoid storing sensitive data in UI state

## Testing Strategy

### Unit Testing
- Test core wallet functionality in isolation
- Mock external dependencies
- Focus on security-critical paths

### Integration Testing
- Test communication between components
- Verify encryption/decryption flows
- Test transaction signing process

### E2E Testing
- Test complete user flows
- Verify extension installation and setup
- Test interaction with web pages

## Common Issues & Solutions

### Issue 1: Background Script Disconnects
**Solution**:
- Implement proper message passing error handling
- Add reconnection logic
- Use `chrome.runtime.connect` for persistent connections

### Issue 2: Memory Leaks
**Solution**:
- Clean up event listeners
- Unsubscribe from subscriptions
- Use `useEffect` cleanup functions

### Issue 3: Transaction Signing Failures
**Solution**:
- Validate transaction data before signing
- Implement proper error handling
- Provide clear error messages to users

## Performance Optimization

### Startup Time
- Lazy load non-critical components
- Optimize bundle size
- Use code splitting

### Memory Usage
- Implement proper cleanup
- Use pagination for transaction lists
- Optimize re-renders with React.memo

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
[MIT License](LICENSE)
