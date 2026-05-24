import type { AavePositionSnapshot, BorrowSimulation, PortfolioSummary } from './aaveTypes';

export function calculatePortfolio(snapshot: AavePositionSnapshot): PortfolioSummary {
  const collateralUsdt = snapshot.supplies
    .filter((supply) => supply.collateralEnabled)
    .reduce((total, supply) => total + supply.amount * supply.priceUsdt, 0);

  const debtUsdt = snapshot.borrows.reduce(
    (total, borrow) => total + borrow.amount * borrow.priceUsdt,
    0
  );

  const weightedBorrowApy =
    debtUsdt === 0
      ? 0
      : snapshot.borrows.reduce((total, borrow) => {
          const borrowValue = borrow.amount * borrow.priceUsdt;
          return total + borrow.variableBorrowApy * (borrowValue / debtUsdt);
        }, 0);

  return {
    collateralUsdt,
    collateralBrl: collateralUsdt * snapshot.usdtBrl,
    debtUsdt,
    debtBrl: debtUsdt * snapshot.usdtBrl,
    ltvPercent: collateralUsdt === 0 ? 0 : (debtUsdt / collateralUsdt) * 100,
    weightedBorrowApy
  };
}

export function calculateBorrowRoom(portfolio: PortfolioSummary, targetLtvPercent: number): number {
  return Math.max(0, portfolio.collateralUsdt * (targetLtvPercent / 100) - portfolio.debtUsdt);
}

export function calculateBorrowForTargetLtv(
  portfolio: PortfolioSummary,
  targetLtvPercent: number
): number {
  return calculateBorrowRoom(portfolio, targetLtvPercent);
}

export function calculateLiquidationPrice(
  snapshot: AavePositionSnapshot,
  liquidationLtvPercent: number,
  collateralSymbol = 'WBTC'
): number | null {
  const portfolio = calculatePortfolio(snapshot);
  const trackedCollateral = snapshot.supplies.find(
    (supply) => supply.collateralEnabled && supply.symbol.toUpperCase() === collateralSymbol.toUpperCase()
  );

  if (!trackedCollateral || trackedCollateral.amount <= 0 || portfolio.debtUsdt <= 0) {
    return null;
  }

  const trackedCollateralValue = trackedCollateral.amount * trackedCollateral.priceUsdt;
  const otherCollateralUsdt = portfolio.collateralUsdt - trackedCollateralValue;
  const requiredCollateralUsdt = portfolio.debtUsdt / (liquidationLtvPercent / 100);
  const requiredTrackedCollateralUsdt = requiredCollateralUsdt - otherCollateralUsdt;

  return requiredTrackedCollateralUsdt <= 0
    ? 0
    : requiredTrackedCollateralUsdt / trackedCollateral.amount;
}

export function simulateBorrow(
  portfolio: PortfolioSummary,
  additionalBorrowUsdt: number,
  targetLtvPercent: number
): BorrowSimulation {
  const simulatedDebtUsdt = portfolio.debtUsdt + Math.max(0, additionalBorrowUsdt);
  const simulatedLtvPercent =
    portfolio.collateralUsdt === 0 ? 0 : (simulatedDebtUsdt / portfolio.collateralUsdt) * 100;
  const remainingBeforeTargetUsdt = portfolio.collateralUsdt * (targetLtvPercent / 100) - simulatedDebtUsdt;

  return {
    simulatedDebtUsdt,
    simulatedLtvPercent,
    remainingBeforeTargetUsdt,
    exceedsTarget: remainingBeforeTargetUsdt < 0
  };
}
