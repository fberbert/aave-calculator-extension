import type { AavePositionSnapshot } from '../domain/aaveTypes';
import { formatCrypto, formatMoney, formatPercent } from '../domain/formatters';

export function PositionTable({ snapshot }: { snapshot: AavePositionSnapshot }) {
  return (
    <div className="positions">
      <section>
        <h3>Supply</h3>
        {snapshot.supplies.length === 0 ? (
          <p className="empty">Nenhuma garantia suportada encontrada.</p>
        ) : (
          snapshot.supplies.map((supply) => (
            <div className="position-row" key={`supply-${supply.symbol}`}>
              <strong>{supply.symbol}</strong>
              <span>{formatCrypto(supply.amount, supply.symbol)}</span>
              <span>{formatMoney(supply.amount * supply.priceUsdt)}</span>
              <small>{supply.collateralEnabled ? 'Collateral ON' : 'Collateral OFF'}</small>
            </div>
          ))
        )}
      </section>

      <section>
        <h3>Borrow</h3>
        {snapshot.borrows.length === 0 ? (
          <p className="empty">Nenhuma dívida suportada encontrada.</p>
        ) : (
          snapshot.borrows.map((borrow) => (
            <div className="position-row" key={`borrow-${borrow.symbol}`}>
              <strong>{borrow.symbol}</strong>
              <span>{formatCrypto(borrow.amount, borrow.symbol)}</span>
              <span>{formatMoney(borrow.amount * borrow.priceUsdt)}</span>
              <small>APY {formatPercent(borrow.variableBorrowApy)}</small>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
