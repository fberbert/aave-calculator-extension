import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchExtensionKuCoinPrices } from '../services/extensionPriceClient';

describe('extension price client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks the extension background worker for KuCoin prices', async () => {
    const sendMessage = vi.fn((message, callback) => {
      callback({
        ok: true,
        prices: {
          btcUsdt: 75402.34,
          usdtBrl: 5.05,
          updatedAt: 1729172965609,
          source: 'KuCoin'
        }
      });
    });

    vi.stubGlobal('chrome', {
      runtime: {
        lastError: undefined,
        sendMessage
      }
    });

    await expect(fetchExtensionKuCoinPrices()).resolves.toEqual({
      btcUsdt: 75402.34,
      usdtBrl: 5.05,
      updatedAt: 1729172965609,
      source: 'KuCoin'
    });
    expect(sendMessage).toHaveBeenCalledWith({ type: 'FETCH_KUCOIN_PRICES' }, expect.any(Function));
  });

  it('surfaces background worker errors', async () => {
    vi.stubGlobal('chrome', {
      runtime: {
        lastError: undefined,
        sendMessage: vi.fn((_message, callback) => {
          callback({ ok: false, error: 'KuCoin BTC-USDT request failed with 429' });
        })
      }
    });

    await expect(fetchExtensionKuCoinPrices()).rejects.toThrow(
      'KuCoin BTC-USDT request failed with 429'
    );
  });
});
