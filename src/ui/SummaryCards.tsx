import type { PortfolioSummary } from '../domain/aaveTypes';
import { formatMoney, formatPercent } from '../domain/formatters';

type Props = {
  portfolio: PortfolioSummary;
  borrowRoomUsdt: number;
  liquidationPriceUsdt: number | null;
  usdtBrl: number;
};

export function SummaryCards({ portfolio, borrowRoomUsdt, liquidationPriceUsdt, usdtBrl }: Props) {
  const ltvTone = portfolio.ltvPercent >= 70 ? 'danger' : portfolio.ltvPercent >= 50 ? 'warning' : 'ok';

  return (
    <div className="summary-grid">
      <Metric label="Garantia" value={formatMoney(portfolio.collateralUsdt)} tone="collateral" subvalue={formatMoney(portfolio.collateralBrl, 'BRL')} />
      <Metric label="Dívida" value={formatMoney(portfolio.debtUsdt)} tone="debt" subvalue={formatMoney(portfolio.debtBrl, 'BRL')} />
      <Metric label="LTV atual" value={formatPercent(portfolio.ltvPercent)} tone={ltvTone} subvalue="Dívida / garantia" />
      <Metric label="Borrow até 70%" value={formatMoney(borrowRoomUsdt)} tone="capacity" subvalue={formatMoney(borrowRoomUsdt * usdtBrl, 'BRL')} />
      <Metric
        label="BTC liquida em 75%"
        value={liquidationPriceUsdt === null ? 'Sem BTC' : formatMoney(liquidationPriceUsdt)}
        tone="liquidation"
        subvalue="Preço crítico simulado"
      />
      <Metric label="APY borrow" value={formatPercent(portfolio.weightedBorrowApy)} tone="yield" subvalue="Média ponderada" />
    </div>
  );
}

function Metric({
  label,
  value,
  subvalue,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  subvalue: string;
  tone?: 'neutral' | 'ok' | 'warning' | 'danger' | 'capacity' | 'liquidation' | 'collateral' | 'debt' | 'yield';
}) {
  return (
    <article className={`metric metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{subvalue}</small>
    </article>
  );
}
