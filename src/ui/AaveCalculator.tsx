import { Calculator, RefreshCw, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AUTO_REFRESH_INTERVAL_MS,
  canAutoRefresh,
  getNextRefreshAt,
  isEvmAddress
} from '../domain/autoRefresh';
import { calculateBorrowRoom, calculateLiquidationPrice, calculatePortfolio } from '../domain/calculations';
import type { AavePositionSnapshot } from '../domain/aaveTypes';
import { fetchAaveArbitrumSnapshot } from '../services/aaveClient';
import { fetchExtensionKuCoinPrices } from '../services/extensionPriceClient';
import { injectWalletBridge, listenForWalletAddress, requestWalletAddress } from '../services/walletDetector';
import { BorrowSimulator } from './BorrowSimulator';
import { PositionTable } from './PositionTable';
import { SummaryCards } from './SummaryCards';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const demoSnapshot: AavePositionSnapshot = {
  walletAddress: null,
  market: 'Aave V3 Arbitrum',
  updatedAt: Date.now(),
  btcPriceUsdt: 75402.34739696793,
  supplies: [{ symbol: 'WBTC', amount: 0.0089972, priceUsdt: 75402.34739696793, collateralEnabled: true }],
  borrows: [{ symbol: 'USDT', amount: 220.17, priceUsdt: 0.9989099332334106, variableBorrowApy: 3.71 }],
  usdtBrl: 5.42
};

export function AaveCalculator() {
  const [open, setOpen] = useState(false);
  const refreshInFlightRef = useRef(false);
  const initialRefreshTriggeredRef = useRef(false);
  const [snapshot, setSnapshot] = useState<AavePositionSnapshot>(demoSnapshot);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [manualWallet, setManualWallet] = useState('');
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  useEffect(() => {
    injectWalletBridge();
    const stop = listenForWalletAddress((address) => {
      setWalletAddress(address);
      if (address) setManualWallet(address);
    });
    requestWalletAddress();
    return stop;
  }, []);

  const portfolio = useMemo(() => calculatePortfolio(snapshot), [snapshot]);
  const borrowRoomUsdt = useMemo(() => calculateBorrowRoom(portfolio, 70), [portfolio]);
  const liquidationPriceUsdt = useMemo(() => calculateLiquidationPrice(snapshot, 75), [snapshot]);
  const activeWallet = (manualWallet || walletAddress)?.trim() ?? '';
  const nextRefreshAt = lastRefreshAt ? getNextRefreshAt(lastRefreshAt) : null;

  useEffect(() => {
    if (initialRefreshTriggeredRef.current || state !== 'idle' || !isEvmAddress(activeWallet)) return;

    initialRefreshTriggeredRef.current = true;
    void refreshLiveData('manual');
  }, [activeWallet, state]);

  useEffect(() => {
    if (!autoRefreshEnabled || !canAutoRefresh(activeWallet, state)) return;

    const delay = Math.max(
      2_000,
      nextRefreshAt ? nextRefreshAt - Date.now() : AUTO_REFRESH_INTERVAL_MS
    );
    const timer = window.setTimeout(() => {
      void refreshLiveData('auto');
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeWallet, autoRefreshEnabled, lastRefreshAt, nextRefreshAt, state]);

  async function refreshLiveData(trigger: 'manual' | 'auto' = 'manual') {
    const address = activeWallet;
    if (!isEvmAddress(address)) {
      setError('Informe ou conecte uma carteira EVM válida.');
      setState('error');
      return;
    }

    if (refreshInFlightRef.current) return;

    refreshInFlightRef.current = true;
    if (trigger === 'manual') {
      setState('loading');
    } else {
      setAutoRefreshing(true);
    }
    setError(null);
    try {
      const prices = await fetchExtensionKuCoinPrices();
      const liveSnapshot = await fetchAaveArbitrumSnapshot(address, prices);
      setSnapshot(liveSnapshot);
      setLastRefreshAt(Date.now());
      setState('ready');
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Falha ao carregar dados da Aave.');
      setState('error');
    } finally {
      refreshInFlightRef.current = false;
      setAutoRefreshing(false);
    }
  }

  function toggleOpen() {
    setOpen((value) => !value);
  }

  return (
    <div className={`aave-calc ${open ? 'is-open' : ''}`}>
      <button
        className="aave-calc__trigger"
        type="button"
        onClick={toggleOpen}
        title="Abrir calculadora"
        aria-label="Abrir calculadora Aave"
      >
        <Calculator size={24} />
      </button>

      <section className="aave-calc__panel" aria-label="Aave LTV calculator" onWheel={(event) => event.stopPropagation()}>
        <header className="aave-calc__header">
          <div>
            <p className="aave-calc__eyebrow">Arbitrum Market</p>
            <h2>Margem Aave</h2>
          </div>
          <div className="panel-actions">
            <button className="icon-button" type="button" onClick={() => void refreshLiveData('manual')} disabled={state === 'loading'} title="Atualizar">
              <RefreshCw size={18} />
            </button>
            <button className="icon-button" type="button" onClick={() => setOpen(false)} title="Fechar calculadora" aria-label="Fechar calculadora">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="control-strip">
          <label className="wallet-row">
            <Wallet size={15} />
            <input
              value={manualWallet}
              onChange={(event) => setManualWallet(event.target.value)}
              placeholder="0x... carteira"
              aria-label="Carteira EVM"
            />
          </label>

          <label className="auto-refresh-row">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(event) => setAutoRefreshEnabled(event.target.checked)}
            />
            <span>Auto</span>
            <small>{autoRefreshEnabled && autoRefreshing ? 'agora' : ''}</small>
          </label>
        </div>

        {state === 'loading' && <p className="notice">Carregando preços KuCoin e posição Aave...</p>}
        {error && <p className="notice notice--error">{error}</p>}

        <SummaryCards
          portfolio={portfolio}
          borrowRoomUsdt={borrowRoomUsdt}
          liquidationPriceUsdt={liquidationPriceUsdt}
          usdtBrl={snapshot.usdtBrl}
          btcPriceUsdt={snapshot.btcPriceUsdt}
        />
        <BorrowSimulator snapshot={snapshot} portfolio={portfolio} targetLtvPercent={70} usdtBrl={snapshot.usdtBrl} />
        <PositionTable snapshot={snapshot} />

        <footer className="aave-calc__footer">
          <span>Preços: KuCoin</span>
          <span>{new Date(snapshot.updatedAt).toLocaleString('pt-BR')}</span>
        </footer>
      </section>
    </div>
  );
}
