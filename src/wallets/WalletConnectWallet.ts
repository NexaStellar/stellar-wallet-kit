import { BaseWallet } from '../core/BaseWallet';
import { WalletConfig } from '../core/types';

interface WalletConnectConfig extends WalletConfig {
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

export class WalletConnectWallet extends BaseWallet {
  constructor(config: WalletConnectConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    throw new Error('WalletConnect support is not implemented');
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
    this.connected = false;
  }

  isAvailable(): boolean {
    return false;
  }

  getName(): string {
    return 'WalletConnect';
  }

  getIcon(): string {
    return 'https://stellar.creit.tech/wallet-icons/walletconnect.svg';
  }

  async signTransaction(_xdr: string): Promise<string> {
    throw new Error('WalletConnect support is not implemented');
  }

  async signAuthEntry(_entry: string): Promise<string> {
    throw new Error('WalletConnect support is not implemented');
  }
}
