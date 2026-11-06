# Stellar Wallet Kit

[![npm version](https://badge.fury.io/js/%40nexastellar%2Fwallet-kit.svg)](https://www.npmjs.com/package/@nexastellar/wallet-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

A modern, type-safe TypeScript library for seamlessly integrating Stellar wallets into web applications. Supports Freighter, Albedo, Rabet, and WalletConnect with a unified API.

## ✨ Features

- **🔌 Multi-Wallet Support**: Freighter, Albedo, Rabet, xBull, WalletConnect
- **🎯 Unified API**: Single interface for all wallet interactions
- **⚡ React Hooks**: Pre-built hooks for React applications
- **🔐 Type-Safe**: Full TypeScript support with comprehensive types
- **📦 Tree-Shakeable**: Import only what you need
- **🎨 UI Components**: Optional pre-styled wallet selection modal
- **🔄 Auto-Connect**: Remember user's wallet preference
- **📱 Mobile Friendly**: WalletConnect support for mobile wallets
- **🧪 Test Utilities**: Mock wallets for testing

## 📦 Installation

```bash
# npm
npm install @nexastellar/wallet-kit

# yarn
yarn add @nexastellar/wallet-kit

# pnpm
pnpm add @nexastellar/wallet-kit
```

## 🚀 Quick Start

### Vanilla TypeScript/JavaScript

```typescript
import { WalletKit, WalletType } from '@nexastellar/wallet-kit';

// Initialize the wallet kit
const walletKit = new WalletKit({
  network: 'testnet',
  projectName: 'My Stellar App',
  autoConnect: true,
});

// Connect to a wallet
async function connectWallet() {
  try {
    const wallet = await walletKit.connect(WalletType.FREIGHTER);
    console.log('Connected:', wallet.publicKey);
    
    // Sign a transaction
    const tx = buildTransaction(); // Your transaction
    const signedTx = await wallet.signTransaction(tx);
    
    // Submit to network
    const result = await walletKit.submitTransaction(signedTx);
    console.log('Transaction hash:', result.hash);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
```

### React

```tsx
import { WalletKitProvider, useWallet } from '@nexastellar/wallet-kit/react';

// Wrap your app
function App() {
  return (
    <WalletKitProvider
      network="testnet"
      projectName="My Stellar App"
    >
      <YourApp />
    </WalletKitProvider>
  );
}

// Use in components
function WalletButton() {
  const {
    wallet,
    isConnected,
    connect,
    disconnect,
    signTransaction,
  } = useWallet();

  if (isConnected) {
    return (
      <div>
        <p>Connected: {wallet.publicKey}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <button onClick={() => connect(WalletType.FREIGHTER)}>
      Connect Wallet
    </button>
  );
}
```

### With UI Modal

```tsx
import { WalletModal } from '@nexastellar/wallet-kit/ui';

function ConnectButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Connect Wallet
      </button>
      
      <WalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={(wallet) => {
          console.log('Connected to:', wallet.type);
          setShowModal(false);
        }}
      />
    </>
  );
}
```

## 📖 API Reference

### WalletKit

```typescript
class WalletKit {
  constructor(config: WalletKitConfig);
  
  // Connection
  connect(type: WalletType): Promise<Wallet>;
  disconnect(): Promise<void>;
  
  // Available wallets
  getAvailableWallets(): WalletInfo[];
  isWalletAvailable(type: WalletType): boolean;
  
  // Transaction
  signTransaction(xdr: string): Promise<string>;
  signAuthEntry(entry: string): Promise<string>;
  submitTransaction(xdr: string): Promise<SubmitResult>;
  
  // Network
  getNetwork(): NetworkType;
  switchNetwork(network: NetworkType): Promise<void>;
  
  // Events
  on(event: WalletEvent, callback: Function): void;
  off(event: WalletEvent, callback: Function): void;
}
```

### React Hooks

```typescript
// useWallet - Main wallet hook
const {
  wallet,
  isConnected,
  isConnecting,
  error,
  connect,
  disconnect,
  signTransaction,
  signAuthEntry,
} = useWallet();

// useWalletList - Available wallets
const { wallets, installedWallets } = useWalletList();

// useBalance - Account balance
const { balance, loading } = useBalance(publicKey);

// useTransaction - Transaction state
const {
  submit,
  isSubmitting,
  result,
  error,
} = useTransaction();
```

## 🎯 Supported Wallets

| Wallet | Browser Extension | Mobile (WalletConnect) | Mainnet | Testnet |
|--------|------------------|------------------------|---------|---------|
| Freighter | ✅ | ❌ | ✅ | ✅ |
| Albedo | ✅ | ❌ | ✅ | ✅ |
| Rabet | ✅ | ❌ | ✅ | ✅ |
| xBull | ✅ | ❌ | ✅ | ✅ |
| WalletConnect | ❌ | ✅ | ✅ | ✅ |

> **Note:** Direct xBull support connects via the browser extension (`window.xBullSDK`). Mobile xBull users can connect using the WalletConnect option.

## 🔧 Configuration

```typescript
interface WalletKitConfig {
  // Network configuration
  network: 'mainnet' | 'testnet' | NetworkConfig;
  
  // App information
  projectName: string;
  projectIcon?: string;
  projectUrl?: string;
  
  // Behavior
  autoConnect?: boolean;
  autoApprove?: boolean;
  
  // WalletConnect (optional)
  walletConnectProjectId?: string;
  
  // Custom RPC endpoints
  horizonUrl?: string;
  sorobanRpcUrl?: string;
}
```

## 📱 Examples

### Sign and Submit Transaction

```typescript
import { WalletKit } from '@nexastellar/wallet-kit';
import {
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
} from '@stellar/stellar-sdk';

const walletKit = new WalletKit({ network: 'testnet' });
await walletKit.connect(WalletType.FREIGHTER);

// Build transaction
const account = await walletKit.loadAccount();
const transaction = new TransactionBuilder(account, {
  fee: '100',
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.payment({
      destination: 'GXXX...',
      asset: Asset.native(),
      amount: '10',
    })
  )
  .setTimeout(30)
  .build();

// Sign and submit
const signedXdr = await walletKit.signTransaction(transaction.toXDR());
const result = await walletKit.submitTransaction(signedXdr);
console.log('Success:', result.hash);
```

### Smart Contract Interaction

```typescript
import { Contract } from '@stellar/stellar-sdk';

// Initialize contract
const contract = new Contract('CONTRACT_ID');

// Build transaction
const tx = await contract.call(
  'transfer',
  ...params
);

// Sign with wallet
const signedTx = await walletKit.signTransaction(tx.toXDR());
const result = await walletKit.submitTransaction(signedTx);
```

### Error Handling

```typescript
try {
  await walletKit.connect(WalletType.FREIGHTER);
} catch (error) {
  if (error.code === 'WALLET_NOT_INSTALLED') {
    // Prompt user to install
    window.open('https://freighter.app', '_blank');
  } else if (error.code === 'USER_REJECTED') {
    // User declined connection
    console.log('Connection rejected');
  } else {
    // Other errors
    console.error('Failed to connect:', error);
  }
}
```

## 🧪 Testing

```typescript
import { MockWallet } from '@nexastellar/wallet-kit/testing';

// Create mock wallet for tests
const mockWallet = new MockWallet({
  publicKey: 'GXXX...',
  network: 'testnet',
});

// Use in tests
test('transaction signing', async () => {
  const signed = await mockWallet.signTransaction(xdr);
  expect(signed).toBeDefined();
});
```

## 🏗️ Architecture

```
stellar-wallet-kit/
├── src/
│   ├── core/
│   │   ├── WalletKit.ts          # Main class
│   │   ├── BaseWallet.ts         # Wallet interface
│   │   └── types.ts              # Type definitions
│   ├── wallets/
│   │   ├── FreighterWallet.ts
│   │   ├── AlbedoWallet.ts
│   │   ├── RabetWallet.ts
│   │   └── WalletConnectWallet.ts
│   ├── react/
│   │   ├── Provider.tsx
│   │   ├── useWallet.ts
│   │   └── hooks/
│   ├── ui/
│   │   ├── Modal.tsx
│   │   └── WalletButton.tsx
│   └── utils/
├── tests/
└── examples/
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/NexaStellar/stellar-wallet-kit.git
cd stellar-wallet-kit

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run examples
npm run dev
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Developer documentation](https://nexastellar.github.io/stellar-wallet-kit/)
- [Examples](https://github.com/NexaStellar/stellar-wallet-kit/tree/main/examples)
- [NPM Package](https://www.npmjs.com/package/@nexastellar/wallet-kit)
- [Report Issues](https://github.com/NexaStellar/stellar-wallet-kit/issues)

The documentation site is maintained in [`docs/`](docs/). GitHub Pages must be enabled with **GitHub Actions** as the build and deployment source.

## 🙏 Acknowledgments

Built for the Stellar ecosystem. NexaStellar intends to apply this repository to the Drips Wave program; approval is pending.

---

**Maintained by NexaStellar** | [Website](https://nexastellar.dev)
