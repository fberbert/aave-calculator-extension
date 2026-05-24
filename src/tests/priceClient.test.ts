import { describe, expect, it, vi } from 'vitest';
import { fetchKuCoinPrices } from '../services/priceClient';

describe('KuCoin price client', () => {
  it('reads BTC-USDT and direct USDT-BRL level-1 ticker prices', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const price = url.includes('BTC-USDT') ? '75402.34' : '5.42';
      return new Response(JSON.stringify({ code: '200000', data: { price, time: 1729172965609 } }));
    });

    const prices = await fetchKuCoinPrices(fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT'
    );
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=USDT-BRL'
    );
    expect(prices.btcUsdt).toBe(75402.34);
    expect(prices.usdtBrl).toBe(5.42);
    expect(prices.source).toBe('KuCoin');
  });

  it('inverts BRL-USDT when USDT-BRL is unavailable', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('USDT-BRL')) {
        return new Response(JSON.stringify({ code: '400100', msg: 'symbol not exists' }), { status: 400 });
      }
      const price = url.includes('BTC-USDT') ? '75402.34' : '0.1845';
      return new Response(JSON.stringify({ code: '200000', data: { price, time: 1729172965609 } }));
    });

    const prices = await fetchKuCoinPrices(fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BRL-USDT'
    );
    expect(prices.usdtBrl).toBeCloseTo(5.42005, 5);
  });
});
