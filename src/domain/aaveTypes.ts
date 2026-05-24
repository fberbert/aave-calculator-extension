export type SupplyPosition = {
  symbol: string;
  amount: number;
  priceUsdt: number;
  collateralEnabled: boolean;
};

export type BorrowPosition = {
  symbol: string;
  amount: number;
  priceUsdt: number;
  variableBorrowApy: number;
};

export type AavePositionSnapshot = {
  walletAddress: string | null;
  market: string;
  updatedAt: number;
  supplies: SupplyPosition[];
  borrows: BorrowPosition[];
  usdtBrl: number;
};

export type PortfolioSummary = {
  collateralUsdt: number;
  collateralBrl: number;
  debtUsdt: number;
  debtBrl: number;
  ltvPercent: number;
  weightedBorrowApy: number;
};

export type BorrowSimulation = {
  simulatedDebtUsdt: number;
  simulatedLtvPercent: number;
  remainingBeforeTargetUsdt: number;
  exceedsTarget: boolean;
};
