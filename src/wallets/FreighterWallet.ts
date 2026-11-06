import { BaseWallet } from '../core/BaseWallet';
import { errorMessage } from '../core/errors';
import { WalletConfig } from '../core/types';

declare global {
  interface Window {
    freighter?: any;
  }
}

export class FreighterWallet extends BaseWallet {
  constructor(config: WalletConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Freighter wallet is not installed');
    }

    try {
      this.publicKey = await window.freighter.getPublicKey();
      this.connected = true;
    } catch (error) {
      throw new Error(`Failed to connect to Freighter: ${errorMessage(error)}`, { cause: error });
    }
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
    this.connected = false;
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.freighter;
  }

  getName(): string {
    return 'Freighter';
  }

  getIcon(): string {
    return 'https://stellar.creit.tech/wallet-icons/freighter.svg';
  }

  async signTransaction(xdr: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await window.freighter.signTransaction(xdr, {
        network: this.config.network,
        networkPassphrase: this.config.networkPassphrase,
      });
      return result;
    } catch (error) {
      throw new Error(`Transaction signing failed: ${errorMessage(error)}`, { cause: error });
    }
  }

  async signAuthEntry(entry: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await window.freighter.signAuthEntry(entry, {
        networkPassphrase: this.config.networkPassphrase,
      });
      return result;
    } catch (error) {
      throw new Error(`Auth entry signing failed: ${errorMessage(error)}`, { cause: error });
    }
  }
}
