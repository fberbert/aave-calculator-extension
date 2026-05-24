import type { PriceSnapshot } from './priceClient';

type KuCoinPriceMessage = {
  type: 'FETCH_KUCOIN_PRICES';
};

type KuCoinPriceResponse =
  | {
      ok: true;
      prices: PriceSnapshot;
    }
  | {
      ok: false;
      error: string;
    };

type ChromeRuntimeShape = {
  runtime?: {
    lastError?: { message?: string };
    sendMessage?: (
      message: KuCoinPriceMessage,
      callback: (response?: KuCoinPriceResponse) => void
    ) => void;
  };
};

export function fetchExtensionKuCoinPrices(): Promise<PriceSnapshot> {
  const runtime = (globalThis.chrome as ChromeRuntimeShape | undefined)?.runtime;
  const sendMessage = runtime?.sendMessage;
  if (!runtime || !sendMessage) {
    return Promise.reject(new Error('Chrome extension runtime is not available.'));
  }

  return new Promise((resolve, reject) => {
    sendMessage({ type: 'FETCH_KUCOIN_PRICES' }, (response) => {
      if (runtime.lastError) {
        reject(new Error(runtime.lastError.message ?? 'Extension background worker failed.'));
        return;
      }

      if (!response) {
        reject(new Error('Extension background worker returned an empty response.'));
        return;
      }

      if (!response.ok) {
        reject(new Error(response.error));
        return;
      }

      resolve(response.prices);
    });
  });
}
