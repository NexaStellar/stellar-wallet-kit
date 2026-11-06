import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WalletKit } from './WalletKit';
import { WalletType } from './types';
import { XBullWallet } from '../wallets/XBullWallet';

describe('WalletKit - xBull integration', () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  let storage: Record<string, string> = {};

  beforeEach(() => {
    storage = {};
    const mockLocalStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        storage = {};
      },
    };

    (globalThis as any).window = {
      localStorage: mockLocalStorage,
    };
    (globalThis as any).localStorage = mockLocalStorage;
  });

  afterEach(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
    if (originalLocalStorage !== undefined) {
      globalThis.localStorage = originalLocalStorage;
    } else {
      delete (globalThis as any).localStorage;
    }
    vi.restoreAllMocks();
  });

  it('can create an xBull adapter for WalletType.XBULL without throwing', () => {
    const kit = new WalletKit({
      network: 'testnet',
      projectName: 'Test App',
      autoConnect: false,
    });

    const isAvailable = kit.isWalletAvailable(WalletType.XBULL);
    expect(isAvailable).toBe(false);
  });

  it('reports xBull as available when window.xBullSDK exists', () => {
    window.xBullSDK = {};
    const kit = new WalletKit({
      network: 'testnet',
      projectName: 'Test App',
      autoConnect: false,
    });

    expect(kit.isWalletAvailable(WalletType.XBULL)).toBe(true);
  });

  it('includes xBull in getAvailableWallets with correct metadata', () => {
    window.xBullSDK = {};
    const kit = new WalletKit({
      network: 'testnet',
      projectName: 'Test App',
      autoConnect: false,
    });

    const wallets = kit.getAvailableWallets();
    const xbullInfo = wallets.find((w) => w.type === WalletType.XBULL);

    expect(xbullInfo).toBeDefined();
    expect(xbullInfo?.name).toBe('xBull');
    expect(xbullInfo?.icon).toBe('https://stellar.creit.tech/wallet-icons/xbull.svg');
    expect(xbullInfo?.available).toBe(true);
  });

  it('connects to xBull wallet, emits connected event, and persists preference', async () => {
    const mockConnect = vi.fn().mockResolvedValue(true);
    const mockGetPublicKey = vi.fn().mockResolvedValue('GBULLPUBLICKEY1234567890');
    window.xBullSDK = {
      connect: mockConnect,
      getPublicKey: mockGetPublicKey,
    };

    const kit = new WalletKit({
      network: 'testnet',
      projectName: 'Test App',
      autoConnect: false,
    });

    const connectedSpy = vi.fn();
    kit.on('connected', connectedSpy);

    const wallet = await kit.connect(WalletType.XBULL);
    expect(wallet).toBeInstanceOf(XBullWallet);
    expect(kit.isConnected()).toBe(true);
    expect(kit.getWallet()).toBe(wallet);
    expect(wallet.getPublicKey()).toBe('GBULLPUBLICKEY1234567890');
    expect(connectedSpy).toHaveBeenCalledWith(wallet);
    expect(storage['nexastellar_wallet_type']).toBe(WalletType.XBULL);
  });

  it('delegates signTransaction and signAuthEntry to connected xBull wallet', async () => {
    const mockSignXDR = vi.fn().mockResolvedValue('SIGNED_TX_XDR');
    const mockSignAuthEntry = vi.fn().mockResolvedValue('SIGNED_AUTH_XDR');

    window.xBullSDK = {
      connect: vi.fn().mockResolvedValue(true),
      getPublicKey: vi.fn().mockResolvedValue('GBULLPUBLICKEY1234567890'),
      signXDR: mockSignXDR,
      signAuthEntry: mockSignAuthEntry,
    };

    const kit = new WalletKit({
      network: 'testnet',
      projectName: 'Test App',
      autoConnect: false,
    });

    await kit.connect(WalletType.XBULL);

    const signedTx = await kit.signTransaction('TX_XDR');
    expect(signedTx).toBe('SIGNED_TX_XDR');

    const signedAuth = await kit.signAuthEntry('AUTH_XDR');
    expect(signedAuth).toBe('SIGNED_AUTH_XDR');
  });

  it('disconnects xBull wallet, clears storage and emits disconnected event', async () => {
    window.xBullSDK = {
      connect: vi.fn().mockResolvedValue(true),
      getPublicKey: vi.fn().mockResolvedValue('GBULLPUBLICKEY1234567890'),
    };

    const kit = new WalletKit({
      network: 'testnet',
      projectName: 'Test App',
      autoConnect: false,
    });

    const disconnectedSpy = vi.fn();
    kit.on('disconnected', disconnectedSpy);

    await kit.connect(WalletType.XBULL);
    expect(kit.isConnected()).toBe(true);

    await kit.disconnect();
    expect(kit.isConnected()).toBe(false);
    expect(kit.getWallet()).toBeNull();
    expect(disconnectedSpy).toHaveBeenCalled();
    expect(storage['nexastellar_wallet_type']).toBeUndefined();
  });
});
