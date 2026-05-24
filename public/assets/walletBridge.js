const AAVE_CALCULATOR_WALLET_EVENT = 'aave-calculator-wallet';

async function emitAaveCalculatorWalletAddress() {
  const ethereum = window.ethereum;
  let address = ethereum?.selectedAddress ?? null;

  if (!address && ethereum?.request) {
    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      address = accounts?.[0] ?? null;
    } catch {
      address = null;
    }
  }

  window.dispatchEvent(
    new CustomEvent(AAVE_CALCULATOR_WALLET_EVENT, {
      detail: { address }
    })
  );
}

window.addEventListener('message', (event) => {
  if (event.source === window && event.data?.type === 'AAVE_CALCULATOR_REQUEST_WALLET') {
    void emitAaveCalculatorWalletAddress();
  }
});

void emitAaveCalculatorWalletAddress();
