import type { PortfolioSummary } from '../domain/aaveTypes';
import { estimateBtcValue, estimateNetBtcBalance } from '../domain/calculations';
import { formatCrypto, formatFixedBtc, formatMoney, formatPercent } from '../domain/formatters';

type Props = {
  portfolio: PortfolioSummary;
  borrowRoomUsdt: number;
  liquidationPriceUsdt: number | null;
  usdtBrl: number;
  btcPriceUsdt?: number;
};

export function SummaryCards({ portfolio, borrowRoomUsdt, liquidationPriceUsdt, usdtBrl, btcPriceUsdt }: Props) {
  const ltvTone = portfolio.ltvPercent >= 70 ? 'danger' : portfolio.ltvPercent >= 50 ? 'warning' : 'ok';
  const collateralBtc = estimateBtcValue(portfolio.collateralUsdt, btcPriceUsdt ?? 0);
  const debtBtc = estimateBtcValue(portfolio.debtUsdt, btcPriceUsdt ?? 0);
  const netBtcBalance = estimateNetBtcBalance(portfolio.collateralUsdt, portfolio.debtUsdt, btcPriceUsdt ?? 0);

  return (
    <div className="summary-grid">
      <Metric label="Garantia" value={formatMoney(portfolio.collateralUsdt)} tone="collateral" subvalue={formatBrlAndBtc(portfolio.collateralBrl, collateralBtc)} />
      <Metric label="Dívida" value={formatMoney(portfolio.debtUsdt)} tone="debt" subvalue={formatBrlAndBtc(portfolio.debtBrl, debtBtc)} />
      <Metric label="LTV atual" value={formatPercent(portfolio.ltvPercent)} tone={ltvTone} subvalue={formatNetBtcBalance(netBtcBalance)} />
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

function formatBrlAndBtc(valueBrl: number, valueBtc: number | null): string {
  if (valueBtc === null) {
    return formatMoney(valueBrl, 'BRL');
  }

  return `${formatMoney(valueBrl, 'BRL')} | ${formatCrypto(valueBtc, 'BTC')}`;
}

function formatNetBtcBalance(valueBtc: number | null): string {
  if (valueBtc === null) {
    return 'Saldo: -- BTC';
  }

  return `Saldo: ${formatFixedBtc(valueBtc)}`;
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
