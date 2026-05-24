import { useMemo, useState } from 'react';
import { calculateBorrowForTargetLtv, simulateBorrow } from '../domain/calculations';
import type { PortfolioSummary } from '../domain/aaveTypes';
import { formatMoney, formatPercent } from '../domain/formatters';

type Props = {
  portfolio: PortfolioSummary;
  targetLtvPercent: number;
  usdtBrl: number;
};

type SimulationMode = 'usdt' | 'ltv';

export function BorrowSimulator({ portfolio, targetLtvPercent, usdtBrl }: Props) {
  const [mode, setMode] = useState<SimulationMode>('usdt');
  const [borrowAmount, setBorrowAmount] = useState('0');
  const [targetLtv, setTargetLtv] = useState(String(targetLtvPercent));
  const amount = Number(borrowAmount.replace(',', '.'));
  const requestedTargetLtv = Number(targetLtv.replace(',', '.'));
  const normalizedTargetLtv = Number.isFinite(requestedTargetLtv)
    ? Math.min(100, Math.max(0, requestedTargetLtv))
    : targetLtvPercent;
  const borrowFromTargetLtv = useMemo(
    () => calculateBorrowForTargetLtv(portfolio, normalizedTargetLtv),
    [portfolio, normalizedTargetLtv]
  );
  const simulatedBorrowAmount =
    mode === 'ltv' ? borrowFromTargetLtv : Number.isFinite(amount) ? amount : 0;
  const simulation = useMemo(
    () => simulateBorrow(portfolio, simulatedBorrowAmount, targetLtvPercent),
    [portfolio, simulatedBorrowAmount, targetLtvPercent]
  );
  const targetIsBelowCurrent = mode === 'ltv' && normalizedTargetLtv <= portfolio.ltvPercent;

  return (
    <section className="simulator">
      <div className="section-label">
        <span>Simulador</span>
        <small>Projetar novo LTV ou capacidade</small>
      </div>
      <div className="simulator__input">
        <div className="segmented-control" aria-label="Tipo de simulação">
          <button
            className={mode === 'usdt' ? 'is-active' : ''}
            type="button"
            onClick={() => setMode('usdt')}
          >
            USDT
          </button>
          <button
            className={mode === 'ltv' ? 'is-active' : ''}
            type="button"
            onClick={() => setMode('ltv')}
          >
            LTV
          </button>
        </div>

        {mode === 'usdt' ? (
          <label>
            <span>Simular novo borrow em USDT</span>
            <input
              value={borrowAmount}
              inputMode="decimal"
              onChange={(event) => setBorrowAmount(event.target.value)}
              aria-label="Novo borrow em USDT"
            />
          </label>
        ) : (
          <label>
            <span>Calcular borrow até LTV</span>
            <input
              value={targetLtv}
              inputMode="decimal"
              onChange={(event) => setTargetLtv(event.target.value)}
              aria-label="LTV desejado"
            />
          </label>
        )}
      </div>
      <div className="simulator__result">
        <span>{mode === 'ltv' ? 'USDT disponível' : 'Novo LTV'}</span>
        <strong>
          {mode === 'ltv'
            ? formatMoney(borrowFromTargetLtv)
            : formatPercent(simulation.simulatedLtvPercent)}
        </strong>
        {mode === 'ltv' && (
          <em>{formatMoney(borrowFromTargetLtv * usdtBrl, 'BRL')}</em>
        )}
        <small>
          {mode === 'ltv'
            ? targetIsBelowCurrent
              ? `LTV atual já está em ${formatPercent(portfolio.ltvPercent)}`
              : `Novo LTV: ${formatPercent(simulation.simulatedLtvPercent)}`
            : simulation.exceedsTarget
              ? `Passa ${formatMoney(Math.abs(simulation.remainingBeforeTargetUsdt))} da meta`
              : `Sobra ${formatMoney(simulation.remainingBeforeTargetUsdt)} até ${targetLtvPercent}%`}
        </small>
      </div>
    </section>
  );
}
