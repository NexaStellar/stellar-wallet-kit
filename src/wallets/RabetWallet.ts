import { BaseWallet } from '../core/BaseWallet';
import { errorMessage } from '../core/errors';
import { WalletConfig } from '../core/types';

declare global {
  interface Window {
    rabet?: any;
  }
}

export class RabetWallet extends BaseWallet {
  constructor(config: WalletConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Rabet wallet is not installed');
    }

    try {
      const result = await window.rabet.connect();
      this.publicKey = result.publicKey;
      this.connected = true;
    } catch (error) {
      throw new Error(`Failed to connect to Rabet: ${errorMessage(error)}`, { cause: error });
    }
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
    this.connected = false;
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.rabet;
  }

  getName(): string {
    return 'Rabet';
  }

  getIcon(): string {
    return 'https://stellar.creit.tech/wallet-icons/rabet.png';
  }

  async signTransaction(xdr: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await window.rabet.sign(xdr, this.config.network);
      return result.xdr;
    } catch (error) {
      throw new Error(`Transaction signing failed: ${errorMessage(error)}`, { cause: error });
    }
  }

  async signAuthEntry(entry: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await window.rabet.signAuthEntry(entry);
      return result;
    } catch (error) {
      throw new Error(`Auth entry signing failed: ${errorMessage(error)}`, { cause: error });
    }
  }
}
