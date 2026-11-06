import { Networks, Horizon } from '@stellar/stellar-sdk';
import { BaseWallet } from './BaseWallet';
import { FreighterWallet } from '../wallets/FreighterWallet';
import { AlbedoWallet } from '../wallets/AlbedoWallet';
import { RabetWallet } from '../wallets/RabetWallet';
import { XBullWallet } from '../wallets/XBullWallet';
import { WalletConnectWallet } from '../wallets/WalletConnectWallet';
import {
  WalletKitConfig,
  WalletType,
  WalletInfo,
  NetworkType,
  WalletEvent,
  SubmitResult,
} from './types';

export class WalletKit {
  private config: Required<WalletKitConfig>;
  private currentWallet: BaseWallet | null = null;
  private eventListeners: Map<WalletEvent, Set<Function>> = new Map();
  private server: Horizon.Server;

  constructor(config: WalletKitConfig) {
    this.config = {
      network: config.network,
      projectName: config.projectName,
      projectIcon: config.projectIcon || '',
      projectUrl: config.projectUrl || '',
      autoConnect: config.autoConnect ?? true,
      autoApprove: config.autoApprove ?? false,
      walletConnectProjectId: config.walletConnectProjectId || '',
      horizonUrl: config.horizonUrl || this.getDefaultHorizonUrl(config.network),
      sorobanRpcUrl: config.sorobanRpcUrl || this.getDefaultSorobanUrl(config.network),
    };

    this.server = new Horizon.Server(this.config.horizonUrl);

    if (this.config.autoConnect) {
      this.restoreConnection();
    }
  }

  /**
   * Connect to a wallet
   */
  async connect(type: WalletType): Promise<BaseWallet> {
    if (this.currentWallet) {
      await this.disconnect();
    }

    const wallet = this.createWallet(type);
    
    if (!wallet.isAvailable()) {
      throw new Error(`${type} wallet is not available`);
    }

    await wallet.connect();
    this.currentWallet = wallet;

    // Save connection preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexastellar_wallet_type', type);
    }

    this.emit('connected', wallet);
    return wallet;
  }

  /**
   * Disconnect current wallet
   */
  async disconnect(): Promise<void> {
    if (!this.currentWallet) {
      return;
    }

    await this.currentWallet.disconnect();
    this.currentWallet = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexastellar_wallet_type');
    }

    this.emit('disconnected');
  }

  /**
   * Get currently connected wallet
   */
  getWallet(): BaseWallet | null {
    return this.currentWallet;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.currentWallet !== null && this.currentWallet.isConnected();
  }

  /**
   * Get list of available wallets
   */
  getAvailableWallets(): WalletInfo[] {
    const walletTypes = Object.values(WalletType);
    return walletTypes
      .map((type) => {
        const wallet = this.createWallet(type);
        return {
          type,
          name: wallet.getName(),
          icon: wallet.getIcon(),
          available: wallet.isAvailable(),
        };
      });
  }

  /**
   * Check if specific wallet is available
   */
  isWalletAvailable(type: WalletType): boolean {
    const wallet = this.createWallet(type);
    return wallet.isAvailable();
  }

  /**
   * Sign transaction
   */
  async signTransaction(xdr: string): Promise<string> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected');
    }

    return this.currentWallet.signTransaction(xdr);
  }

  /**
   * Sign auth entry
   */
  async signAuthEntry(entry: string): Promise<string> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected');
    }

    return this.currentWallet.signAuthEntry(entry);
  }

  /**
   * Submit transaction to network
   */
  async submitTransaction(xdr: string): Promise<SubmitResult> {
    try {
      const transaction = this.server.submitTransaction(xdr as any);
      const result = await transaction;
      
      this.emit('transactionSuccess', result);
      
      return {
        hash: result.hash,
        ledger: result.ledger,
        success: true,
      };
    } catch (error: any) {
      this.emit('transactionError', error);
      throw error;
    }
  }

  /**
   * Get account from network
   */
  async loadAccount(publicKey?: string): Promise<any> {
    const key = publicKey || this.currentWallet?.getPublicKey();
    if (!key) {
      throw new Error('No public key available');
    }

    return this.server.loadAccount(key);
  }

  /**
   * Get network
   */
  getNetwork(): NetworkType {
    return this.config.network;
  }

  /**
   * Get network passphrase
   */
  getNetworkPassphrase(): string {
    return this.config.network === 'mainnet' 
      ? Networks.PUBLIC 
      : Networks.TESTNET;
  }

  /**
   * Switch network
   */
  async switchNetwork(network: NetworkType): Promise<void> {
    this.config.network = network;
    this.config.horizonUrl = this.getDefaultHorizonUrl(network);
    this.config.sorobanRpcUrl = this.getDefaultSorobanUrl(network);
    this.server = new Horizon.Server(this.config.horizonUrl);

    if (this.currentWallet) {
      await this.currentWallet.disconnect();
      this.currentWallet = null;
    }

    this.emit('networkChanged', network);
  }

  /**
   * Event subscription
   */
  on(event: WalletEvent, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: WalletEvent, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event
   */
  private emit(event: WalletEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Create wallet instance
   */
  private createWallet(type: WalletType): BaseWallet {
    const config = {
      network: this.config.network,
      networkPassphrase: this.getNetworkPassphrase(),
    };

    switch (type) {
      case WalletType.FREIGHTER:
        return new FreighterWallet(config);
      case WalletType.ALBEDO:
        return new AlbedoWallet(config);
      case WalletType.RABET:
        return new RabetWallet(config);
      case WalletType.XBULL:
        return new XBullWallet(config);
      case WalletType.WALLETCONNECT:
        return new WalletConnectWallet({
          ...config,
          projectId: this.config.walletConnectProjectId,
          metadata: {
            name: this.config.projectName,
            description: '',
            url: this.config.projectUrl,
            icons: [this.config.projectIcon],
          },
        });
      default:
        throw new Error(`Unsupported wallet type: ${type}`);
    }
  }

  /**
   * Restore previous connection
   */
  private async restoreConnection(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const savedType = localStorage.getItem('nexastellar_wallet_type') as WalletType;
    if (savedType) {
      try {
        await this.connect(savedType);
      } catch (error) {
        console.warn('Failed to restore wallet connection:', error);
        localStorage.removeItem('nexastellar_wallet_type');
      }
    }
  }

  /**
   * Get default Horizon URL
   */
  private getDefaultHorizonUrl(network: NetworkType): string {
    return network === 'mainnet'
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org';
  }

  /**
   * Get default Soroban RPC URL
   */
  private getDefaultSorobanUrl(network: NetworkType): string {
    return network === 'mainnet'
      ? 'https://soroban-rpc.stellar.org'
      : 'https://soroban-testnet.stellar.org';
  }
}
