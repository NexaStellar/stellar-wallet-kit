import { BaseWallet } from '../core/BaseWallet';
import { WalletConfig } from '../core/types';

declare global {
  interface Window {
    albedo?: any;
  }
}

export class AlbedoWallet extends BaseWallet {
  constructor(config: WalletConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Albedo wallet is not available');
    }

    try {
      const result = await window.albedo.publicKey({});
      this.publicKey = result.pubkey;
      this.connected = true;
    } catch (error) {
      throw new Error('Failed to connect to Albedo: ' + (error as Error).message);
    }
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
    this.connected = false;
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.albedo;
  }

  getName(): string {
    return 'Albedo';
  }

  getIcon(): string {
    return 'https://stellar.creit.tech/wallet-icons/albedo.svg';
  }

  async signTransaction(xdr: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await window.albedo.tx({
        xdr,
        network: this.config.network,
      });
      return result.signed_envelope_xdr;
    } catch (error) {
      throw new Error('Transaction signing failed: ' + (error as Error).message);
    }
  }

  async signAuthEntry(_entry: string): Promise<string> {
    throw new Error('Auth entry signing not supported by Albedo');
  }
}
