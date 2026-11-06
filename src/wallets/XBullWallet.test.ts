import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { XBullWallet } from './XBullWallet';
import { Networks } from '@stellar/stellar-sdk';
import { WalletConfig } from '../core/types';

describe('XBullWallet', () => {
  const config: WalletConfig = {
    network: 'testnet',
    networkPassphrase: Networks.TESTNET,
  };

  const originalWindow = globalThis.window;

  beforeEach(() => {
    (globalThis as any).window = {};
  });

  afterEach(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
    vi.restoreAllMocks();
  });

  describe('metadata & availability', () => {
    it('returns correct name and icon', () => {
      const wallet = new XBullWallet(config);
      expect(wallet.getName()).toBe('xBull');
      expect(wallet.getIcon()).toBe('https://stellar.creit.tech/wallet-icons/xbull.svg');
      expect(wallet.getNetwork()).toBe('testnet');
    });

    it('returns false when window.xBullSDK is not installed', () => {
      const wallet = new XBullWallet(config);
      expect(wallet.isAvailable()).toBe(false);
    });

    it('returns true when window.xBullSDK is present', () => {
      window.xBullSDK = {};
      const wallet = new XBullWallet(config);
      expect(wallet.isAvailable()).toBe(true);
    });

    it('returns true when window.xbull is present as an alternative global', () => {
      window.xbull = {};
      const wallet = new XBullWallet(config);
      expect(wallet.isAvailable()).toBe(true);
    });
  });

  describe('connect & disconnect', () => {
    it('throws explicit error when connecting without extension installed', async () => {
      const wallet = new XBullWallet(config);
      await expect(wallet.connect()).rejects.toThrow('xBull wallet is not installed');
      expect(wallet.isConnected()).toBe(false);
      expect(wallet.getPublicKey()).toBeNull();
    });

    it('connects successfully and sets connection state and public key (string return)', async () => {
      const mockConnect = vi.fn().mockResolvedValue({ canRequestPublicKey: true, canRequestSign: true });
      const mockGetPublicKey = vi.fn().mockResolvedValue('GBWM7V3Q3VJJQZ32W2J7D36M2P62MGLNDF3G4C27K4B5M7WNRJ2HQXQW');
      window.xBullSDK = {
        connect: mockConnect,
        getPublicKey: mockGetPublicKey,
      };

      const wallet = new XBullWallet(config);
      await wallet.connect();

      expect(mockConnect).toHaveBeenCalledWith({
        canRequestPublicKey: true,
        canRequestSign: true,
      });
      expect(mockGetPublicKey).toHaveBeenCalled();
      expect(wallet.isConnected()).toBe(true);
      expect(wallet.getPublicKey()).toBe('GBWM7V3Q3VJJQZ32W2J7D36M2P62MGLNDF3G4C27K4B5M7WNRJ2HQXQW');
    });

    it('connects successfully when getPublicKey returns an object with publicKey', async () => {
      window.xBullSDK = {
        connect: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue({ publicKey: 'GAAAZZZ111222333' }),
      };

      const wallet = new XBullWallet(config);
      await wallet.connect();

      expect(wallet.isConnected()).toBe(true);
      expect(wallet.getPublicKey()).toBe('GAAAZZZ111222333');
    });

    it('handles user rejection during connect and leaves no stale state', async () => {
      window.xBullSDK = {
        connect: vi.fn().mockRejectedValue(new Error('User declined connection')),
        getPublicKey: vi.fn(),
      };

      const wallet = new XBullWallet(config);
      await expect(wallet.connect()).rejects.toThrow('Failed to connect to xBull: User declined connection');
      expect(wallet.isConnected()).toBe(false);
      expect(wallet.getPublicKey()).toBeNull();
    });

    it('handles failure when public key is invalid or empty without leaving stale state', async () => {
      window.xBullSDK = {
        connect: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue(null),
      };

      const wallet = new XBullWallet(config);
      await expect(wallet.connect()).rejects.toThrow('Failed to connect to xBull: Failed to retrieve public key');
      expect(wallet.isConnected()).toBe(false);
      expect(wallet.getPublicKey()).toBeNull();
    });

    it('disconnects and clears public key and connection state', async () => {
      const mockClose = vi.fn().mockResolvedValue(undefined);
      window.xBullSDK = {
        connect: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue('GBWM7V3Q3VJJQZ32W2J7D36M2P62MGLNDF3G4C27K4B5M7WNRJ2HQXQW'),
        close: mockClose,
      };

      const wallet = new XBullWallet(config);
      await wallet.connect();
      expect(wallet.isConnected()).toBe(true);

      await wallet.disconnect();
      expect(wallet.isConnected()).toBe(false);
      expect(wallet.getPublicKey()).toBeNull();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('transaction signing', () => {
    it('throws if transaction signing is attempted while disconnected', async () => {
      window.xBullSDK = {
        signXDR: vi.fn(),
      };
      const wallet = new XBullWallet(config);
      await expect(wallet.signTransaction('AAAA...')).rejects.toThrow('Wallet not connected');
    });

    it('signs transaction successfully via signXDR returning a string', async () => {
      const mockSignXDR = vi.fn().mockResolvedValue('SIGNED_XDR_RESULT');
      window.xBullSDK = {
        connect: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue('GPUBLICKEY123'),
        signXDR: mockSignXDR,
      };

      const wallet = new XBullWallet(config);
      await wallet.connect();

      const result = await wallet.signTransaction('UNITS_XDR');
      expect(result).toBe('SIGNED_XDR_RESULT');
      expect(mockSignXDR).toHaveBeenCalledWith('UNITS_XDR', {
        network: Networks.TESTNET,
        publicKey: 'GPUBLICKEY123',
      });
    });

    it('signs transaction successfully when provider returns an object with signed xdr', async () => {
      window.xBullSDK = {
        connect: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue('GPUBLICKEY123'),
        signXDR: vi.fn().mockResolvedValue({ xdr: 'SIGNED_ENVELOPE_XDR' }),
      };

      const wallet = new XBullWallet(config);
      await wallet.connect();

      const result = await wallet.signTransaction('UNITS_XDR');
      expect(result).toBe('SIGNED_ENVELOPE_XDR');
    });

    it('handles user cancellation / rejection during transaction signing', async () => {
      window.xBullSDK = {
        connect: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue('GPUBLICKEY123'),
        signXDR: vi.fn().mockRejectedValue(new Error('User rejected signature')),
      };

      const wallet = new XBullWallet(config);
      await wallet.connect();

      await expect(wallet.signTransaction('UNITS_XDR')).rejects.toThrow(
        'Transaction signing failed: User rejected signature'
      );
      // Wallet remains connected even if signing transaction was cancelled
      expect(wallet.isConnected()).toBe(true);
      expect(wallet.getPublicKey()).toBe('GPUBLICKEY123');
    });

    it('throws error if provider does not support signing', async () => {
      window.xBullSDK = {
        connect: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue('GPUBLICKEY123'),
      };

      const wallet = new XBullWallet(config);
      await wallet.connect();

      await expect(wallet.signTransaction('UNITS_XDR')).rejects.toThrow(
        'Transaction signing failed: Signing is not supported by xBull provider'
      );
    });
  });

  describe('auth entry signing', () => {
    it('throws if auth entry signing is attempted while disconnected', async () => {
      const wallet = new XBullWallet(config);
      await expect(wallet.signAuthEntry('AUTH_ENTRY_XDR')).rejects.toThrow('Wallet not connected');
    });

    it('throws explicit unsupported error if provider lacks signAuthEntry capability', async () => {
      window.xBullSDK = {
        connect: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue('GPUBLICKEY123'),
      };

      const wallet = new XBullWallet(config);
      await wallet.connect();

      await expect(wallet.signAuthEntry('AUTH_ENTRY_XDR')).rejects.toThrow(
        'Auth entry signing not supported by xBull'
      );
    });

    it('signs auth entry successfully when provider supports signAuthEntry', async () => {
      const mockSignAuthEntry = vi.fn().mockResolvedValue('SIGNED_AUTH_ENTRY');
      window.xBullSDK = {
        connect: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue('GPUBLICKEY123'),
        signAuthEntry: mockSignAuthEntry,
      };

      const wallet = new XBullWallet(config);
      await wallet.connect();

      const signed = await wallet.signAuthEntry('AUTH_ENTRY_XDR');
      expect(signed).toBe('SIGNED_AUTH_ENTRY');
      expect(mockSignAuthEntry).toHaveBeenCalledWith('AUTH_ENTRY_XDR', {
        networkPassphrase: Networks.TESTNET,
        publicKey: 'GPUBLICKEY123',
        address: 'GPUBLICKEY123',
      });
    });

    it('handles rejection when provider signAuthEntry is rejected by user', async () => {
      window.xBullSDK = {
        connect: vi.fn().mockResolvedValue(true),
        getPublicKey: vi.fn().mockResolvedValue('GPUBLICKEY123'),
        signAuthEntry: vi.fn().mockRejectedValue(new Error('User denied auth entry signature')),
      };

      const wallet = new XBullWallet(config);
      await wallet.connect();

      await expect(wallet.signAuthEntry('AUTH_ENTRY_XDR')).rejects.toThrow(
        'Auth entry signing failed: User denied auth entry signature'
      );
    });
  });
});
