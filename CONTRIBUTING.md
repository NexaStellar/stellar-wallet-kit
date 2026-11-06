# Contributing

Thanks for helping improve Stellar Wallet Kit. Contributions should describe the user-facing problem, stay focused, and include tests for changed behavior.

## Development setup

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

Use `npm run test:watch` while developing. Do not commit generated `dist/` output, dependency directories, or secrets.

## Pull requests

- Explain the problem and the intended behavior in the pull request.
- Keep README and `docs/` aligned with implemented behavior; do not describe planned adapters as supported.
- Add or update focused tests for behavior changes.
- Confirm all CI checks pass before requesting review.

Wallet integrations handle signing requests. Never include secret keys, seed phrases, or real user credentials in code, fixtures, logs, or issue reports.
