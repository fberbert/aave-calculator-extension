import { describe, expect, it, vi } from 'vitest';
import { fetchKuCoinPrices } from '../services/priceClient';

describe('KuCoin price client', () => {
  it('reads BTC-USDT ticker and fiat USDT price in BRL', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/prices')) {
        return new Response(JSON.stringify({ code: '200000', data: { USDT: '5.21419273' } }));
      }

      const price = url.includes('BTC-USDT') ? '75402.34' : '0';
      return new Response(JSON.stringify({ code: '200000', data: { price, time: 1729172965609 } }));
    });

    const prices = await fetchKuCoinPrices(fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT'
    );
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.kucoin.com/api/v1/prices?base=BRL&currencies=USDT'
    );
    expect(prices.btcUsdt).toBe(75402.34);
    expect(prices.usdtBrl).toBe(5.21419273);
    expect(prices.source).toBe('KuCoin');
  });

  it('rejects invalid fiat USDT price responses', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/prices')) {
        return new Response(JSON.stringify({ code: '200000', data: {} }));
      }

      return new Response(JSON.stringify({ code: '200000', data: { price: '75402.34', time: 1729172965609 } }));
    });

    await expect(fetchKuCoinPrices(fetcher)).rejects.toThrow(
      'KuCoin fiat USDT/BRL response did not contain a valid price'
    );
  });
});
