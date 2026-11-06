# Stellar Wallet Kit

[![CI](https://github.com/NexaStellar/stellar-wallet-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/NexaStellar/stellar-wallet-kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript library for connecting browser-injected Stellar wallets and signing transaction XDR. The project is an early-stage, unaudited prototype; verify wallet-provider behavior and transaction details before use.

## 📚 Documentation

The [Stellar Wallet Kit documentation site](https://nexastellar.github.io/stellar-wallet-kit/) includes setup guidance, implementation status, supported adapters, API behavior, and development instructions.

## Current capabilities

- One `WalletKit` API for Freighter, Albedo, Rabet, and xBull browser extensions.
- Connect/disconnect, transaction signing, and Soroban authorization-entry signing where a provider supports it.
- Horizon account loading and transaction submission.
- Optional restoration of the previously selected browser wallet.

**WalletConnect is not implemented and is reported unavailable.** React hooks, UI components, and mock/testing adapters are not included. Do not rely on older examples that describe those planned features.

## Install

```bash
npm install @nexastellar/wallet-kit
```

## Quick start

```typescript
import { WalletKit, WalletType } from '@nexastellar/wallet-kit';

const kit = new WalletKit({
  network: 'testnet',
  projectName: 'My Stellar App',
  autoConnect: false,
});

const wallet = await kit.connect(WalletType.FREIGHTER);
const unsignedXdr = buildTransactionXdr(); // Build and validate this in your application.
const signedXdr = await wallet.signTransaction(unsignedXdr);
const result = await kit.submitTransaction(signedXdr);

console.log('Transaction hash:', result.hash);
```

Wallet operations require a browser with the corresponding extension installed. The kit does not construct transactions, custody keys, or validate that a transaction matches your application's intent. Review network, destination, amount, and fees before requesting a signature.

## Wallet and API reference

| Adapter | Supported operations |
|---|---|
| Freighter | Connect, transaction signing, Soroban auth-entry signing |
| Albedo | Connect and transaction signing; auth-entry signing is unsupported |
| Rabet | Connect, transaction signing, Soroban auth-entry signing |
| xBull | Connect, transaction signing, and provider-dependent auth-entry signing |
| WalletConnect | Not implemented; reports unavailable |

`WalletKit` exposes `connect`, `disconnect`, `getWallet`, `isConnected`, `getAvailableWallets`, `isWalletAvailable`, `signTransaction`, `signAuthEntry`, `submitTransaction`, `loadAccount`, `getNetwork`, `getNetworkPassphrase`, `switchNetwork`, `on`, and `off`. See the [API documentation](https://nexastellar.github.io/stellar-wallet-kit/#api) for behavior and limitations.

The required configuration is `network` (`mainnet` or `testnet`) and `projectName`. Optional settings include `autoConnect`, `projectIcon`, `projectUrl`, `horizonUrl`, `sorobanRpcUrl`, `autoApprove`, and `walletConnectProjectId`. `autoConnect` defaults to `true` and restores a saved wallet type from browser local storage. `autoApprove` and `sorobanRpcUrl` are reserved but currently have no effect; custom Horizon endpoints are used for account loading and transaction submission.

## Development

Requirements: Node.js 22.13 or newer and npm.

```bash
git clone https://github.com/NexaStellar/stellar-wallet-kit.git
cd stellar-wallet-kit
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for pull request guidance. CI runs lint, type checking, tests, and package builds on Node.js 22 and 24.

## Project status and links

This repository is an unaudited prototype, not a production security certification. Provider APIs can change, and a successful signature does not guarantee that Horizon accepts a transaction.

- [Developer documentation](https://nexastellar.github.io/stellar-wallet-kit/)
- [Issues](https://github.com/NexaStellar/stellar-wallet-kit/issues)
- [npm package](https://www.npmjs.com/package/@nexastellar/wallet-kit)
- [MIT license](LICENSE)
