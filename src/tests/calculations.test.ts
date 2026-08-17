import { describe, expect, it } from 'vitest';
import {
  calculateBorrowForTargetLtv,
  calculateBorrowRoom,
  calculateLiquidationPrice,
  calculateSimulatedLiquidationPrice,
  calculatePortfolio,
  estimateBtcValue,
  estimateNetBtcBalance,
  simulateBorrow
} from '../domain/calculations';
import type { AavePositionSnapshot } from '../domain/aaveTypes';

const snapshot: AavePositionSnapshot = {
  walletAddress: '0x0000000000000000000000000000000000000001',
  market: 'Aave V3 Arbitrum',
  updatedAt: 1729172965609,
  supplies: [
    {
      symbol: 'WBTC',
      amount: 0.0089972,
      priceUsdt: 75402.34739696793,
      collateralEnabled: true
    }
  ],
  borrows: [
    {
      symbol: 'USDT',
      amount: 220.17,
      priceUsdt: 0.99891,
      variableBorrowApy: 3.71
    }
  ],
  usdtBrl: 5.42
};

describe('Aave calculator math', () => {
  it('summarizes collateral, debt, LTV, borrow room, liquidation price, and borrow APY', () => {
    const portfolio = calculatePortfolio(snapshot);

    expect(portfolio.collateralUsdt).toBeCloseTo(678.41, 2);
    expect(portfolio.collateralBrl).toBeCloseTo(3676.98, 2);
    expect(portfolio.debtUsdt).toBeCloseTo(219.93, 2);
    expect(portfolio.debtBrl).toBeCloseTo(1192.02, 2);
    expect(portfolio.ltvPercent).toBeCloseTo(32.42, 2);
    expect(portfolio.weightedBorrowApy).toBeCloseTo(3.71, 2);
    expect(calculateBorrowRoom(portfolio, 70)).toBeCloseTo(254.96, 2);
    expect(calculateLiquidationPrice(snapshot, 75)).toBeCloseTo(32592.36, 2);
  });

  it('simulates an additional USDT borrow against unchanged collateral', () => {
    const portfolio = calculatePortfolio(snapshot);
    const simulation = simulateBorrow(portfolio, 100, 70);

    expect(simulation.simulatedDebtUsdt).toBeCloseTo(319.93, 2);
    expect(simulation.simulatedLtvPercent).toBeCloseTo(47.16, 2);
    expect(simulation.remainingBeforeTargetUsdt).toBeCloseTo(154.96, 2);
    expect(simulation.exceedsTarget).toBe(false);
    expect(calculateSimulatedLiquidationPrice(snapshot, 100, 75)).toBeCloseTo(47411.79, 2);
  });

  it('calculates how much USDT can be borrowed to reach a target LTV', () => {
    const portfolio = calculatePortfolio(snapshot);

    expect(calculateBorrowForTargetLtv(portfolio, 50)).toBeCloseTo(119.27, 2);
    expect(calculateBorrowForTargetLtv(portfolio, 70)).toBeCloseTo(254.96, 2);
    expect(calculateBorrowForTargetLtv(portfolio, 30)).toBe(0);
  });

  it('estimates a USDT value in BTC using the current BTC price', () => {
    expect(estimateBtcValue(678.41, 75402.34739696793)).toBeCloseTo(0.0089972, 8);
    expect(estimateBtcValue(219.93, 75402.34739696793)).toBeCloseTo(0.00291675, 8);
    expect(estimateBtcValue(219.93, 0)).toBeNull();
  });

  it('estimates the net BTC balance from collateral minus debt', () => {
    expect(estimateNetBtcBalance(678.41, 219.93, 75402.34739696793)).toBeCloseTo(0.00608045, 8);
    expect(estimateNetBtcBalance(678.41, 219.93, 0)).toBeNull();
  });
});
