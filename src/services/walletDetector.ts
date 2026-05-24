export type WalletDetection = {
  address: string | null;
  source: 'injected-wallet' | 'manual' | 'none';
};

const WALLET_EVENT = 'aave-calculator-wallet';

export function injectWalletBridge(): void {
  if (document.getElementById('aave-calculator-wallet-bridge')) return;

  const script = document.createElement('script');
  script.id = 'aave-calculator-wallet-bridge';
  script.src = chrome.runtime.getURL('assets/walletBridge.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

export function listenForWalletAddress(onAddress: (address: string | null) => void): () => void {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<{ address: string | null }>;
    onAddress(customEvent.detail.address);
  };
  window.addEventListener(WALLET_EVENT, listener);
  return () => window.removeEventListener(WALLET_EVENT, listener);
}

export function requestWalletAddress(): void {
  window.postMessage({ type: 'AAVE_CALCULATOR_REQUEST_WALLET' }, '*');
}
