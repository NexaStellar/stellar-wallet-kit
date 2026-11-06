import { BaseWallet } from '../core/BaseWallet';
import { WalletConfig } from '../core/types';

declare global {
  interface Window {
    xBullSDK?: any;
    xbull?: any;
  }
}

export class XBullWallet extends BaseWallet {
  constructor(config: WalletConfig) {
    super(config);
  }

  private getProvider(): any {
    if (typeof window !== 'undefined') {
      return window.xBullSDK || window.xbull;
    }
    return undefined;
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window.xBullSDK || window.xbull);
  }

  getName(): string {
    return 'xBull';
  }

  getIcon(): string {
    return 'https://stellar.creit.tech/wallet-icons/xbull.svg';
  }

  async connect(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('xBull wallet is not installed');
    }

    const provider = this.getProvider();

    try {
      if (typeof provider.connect === 'function') {
        await provider.connect({
          canRequestPublicKey: true,
          canRequestSign: true,
        });
      }

      let publicKey: string | null = null;
      if (typeof provider.getPublicKey === 'function') {
        const keyResult = await provider.getPublicKey();
        publicKey =
          typeof keyResult === 'object' && keyResult !== null && 'publicKey' in keyResult
            ? keyResult.publicKey
            : keyResult;
      }

      if (!publicKey || typeof publicKey !== 'string') {
        throw new Error('Failed to retrieve public key');
      }

      this.publicKey = publicKey;
      this.connected = true;
    } catch (error) {
      this.publicKey = null;
      this.connected = false;
      throw new Error('Failed to connect to xBull: ' + (error as Error).message);
    }
  }

  async disconnect(): Promise<void> {
    const provider = this.getProvider();
    if (provider && typeof provider.close === 'function') {
      try {
        await provider.close();
      } catch {
        // Ignore provider close errors on disconnect
      }
    }
    this.publicKey = null;
    this.connected = false;
  }

  async signTransaction(xdr: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const provider = this.getProvider();
    if (!provider) {
      throw new Error('xBull wallet is not installed');
    }

    try {
      let result: any;
      if (typeof provider.signXDR === 'function') {
        result = await provider.signXDR(xdr, {
          network: this.config.networkPassphrase,
          publicKey: this.publicKey || undefined,
        });
      } else if (typeof provider.signTransaction === 'function') {
        result = await provider.signTransaction(xdr, {
          network: this.config.networkPassphrase,
          publicKey: this.publicKey || undefined,
        });
      } else if (typeof provider.sign === 'function') {
        result = await provider.sign(xdr, {
          network: this.config.networkPassphrase,
          publicKey: this.publicKey || undefined,
        });
      } else {
        throw new Error('Signing is not supported by xBull provider');
      }

      if (typeof result === 'string') {
        return result;
      }
      if (result && typeof result === 'object') {
        return (
          result.xdr ||
          result.signedTxXdr ||
          result.signed_envelope_xdr ||
          result.signedXDR ||
          String(result)
        );
      }
      return result;
    } catch (error) {
      throw new Error('Transaction signing failed: ' + (error as Error).message);
    }
  }

  async signAuthEntry(entry: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    const provider = this.getProvider();
    if (!provider || typeof provider.signAuthEntry !== 'function') {
      throw new Error('Auth entry signing not supported by xBull');
    }

    try {
      const result = await provider.signAuthEntry(entry, {
        networkPassphrase: this.config.networkPassphrase,
        publicKey: this.publicKey || undefined,
        address: this.publicKey || undefined,
      });

      if (typeof result === 'string') {
        return result;
      }
      if (result && typeof result === 'object' && result.signedAuthEntry) {
        return result.signedAuthEntry;
      }
      return result;
    } catch (error) {
      throw new Error('Auth entry signing failed: ' + (error as Error).message);
    }
  }
}
