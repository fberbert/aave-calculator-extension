import { createPublicClient, formatUnits, http, type Address } from 'viem';
import { arbitrum } from 'viem/chains';
import type { AavePositionSnapshot, BorrowPosition, SupplyPosition } from '../domain/aaveTypes';
import type { PriceSnapshot } from './priceClient';

const AAVE_PROTOCOL_DATA_PROVIDER_ARBITRUM =
  '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' as Address;

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http('https://arb1.arbitrum.io/rpc')
});

const dataProviderAbi = [
  {
    name: 'getAllReservesTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'symbol', type: 'string' },
          { name: 'tokenAddress', type: 'address' }
        ]
      }
    ]
  },
  {
    name: 'getReserveConfigurationData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [
      { name: 'decimals', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'liquidationThreshold', type: 'uint256' },
      { name: 'liquidationBonus', type: 'uint256' },
      { name: 'reserveFactor', type: 'uint256' },
      { name: 'usageAsCollateralEnabled', type: 'bool' },
      { name: 'borrowingEnabled', type: 'bool' },
      { name: 'stableBorrowRateEnabled', type: 'bool' },
      { name: 'isActive', type: 'bool' },
      { name: 'isFrozen', type: 'bool' }
    ]
  },
  {
    name: 'getReserveData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [
      { name: 'unbacked', type: 'uint256' },
      { name: 'accruedToTreasuryScaled', type: 'uint256' },
      { name: 'totalAToken', type: 'uint256' },
      { name: 'totalStableDebt', type: 'uint256' },
      { name: 'totalVariableDebt', type: 'uint256' },
      { name: 'liquidityRate', type: 'uint256' },
      { name: 'variableBorrowRate', type: 'uint256' },
      { name: 'stableBorrowRate', type: 'uint256' },
      { name: 'averageStableBorrowRate', type: 'uint256' },
      { name: 'liquidityIndex', type: 'uint256' },
      { name: 'variableBorrowIndex', type: 'uint256' },
      { name: 'lastUpdateTimestamp', type: 'uint40' }
    ]
  },
  {
    name: 'getUserReserveData',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'user', type: 'address' }
    ],
    outputs: [
      { name: 'currentATokenBalance', type: 'uint256' },
      { name: 'currentStableDebt', type: 'uint256' },
      { name: 'currentVariableDebt', type: 'uint256' },
      { name: 'principalStableDebt', type: 'uint256' },
      { name: 'scaledVariableDebt', type: 'uint256' },
      { name: 'stableBorrowRate', type: 'uint256' },
      { name: 'liquidityRate', type: 'uint256' },
      { name: 'stableRateLastUpdated', type: 'uint40' },
      { name: 'usageAsCollateralEnabled', type: 'bool' }
    ]
  }
] as const;

type ReserveToken = {
  symbol: string;
  tokenAddress: Address;
};

export async function fetchAaveArbitrumSnapshot(
  walletAddress: Address,
  prices: PriceSnapshot
): Promise<AavePositionSnapshot> {
  const reserves = (await publicClient.readContract({
    address: AAVE_PROTOCOL_DATA_PROVIDER_ARBITRUM,
    abi: dataProviderAbi,
    functionName: 'getAllReservesTokens'
  })) as ReserveToken[];

  const supplies: SupplyPosition[] = [];
  const borrows: BorrowPosition[] = [];

  for (const reserve of reserves) {
    const normalizedSymbol = normalizeSymbol(reserve.symbol);
    if (!isSupportedPriceAsset(normalizedSymbol)) {
      continue;
    }

    const [configuration, reserveData, userData] = await Promise.all([
      publicClient.readContract({
        address: AAVE_PROTOCOL_DATA_PROVIDER_ARBITRUM,
        abi: dataProviderAbi,
        functionName: 'getReserveConfigurationData',
        args: [reserve.tokenAddress]
      }),
      publicClient.readContract({
        address: AAVE_PROTOCOL_DATA_PROVIDER_ARBITRUM,
        abi: dataProviderAbi,
        functionName: 'getReserveData',
        args: [reserve.tokenAddress]
      }),
      publicClient.readContract({
        address: AAVE_PROTOCOL_DATA_PROVIDER_ARBITRUM,
        abi: dataProviderAbi,
        functionName: 'getUserReserveData',
        args: [reserve.tokenAddress, walletAddress]
      })
    ]);

    const decimals = Number(configuration[0]);
    const suppliedAmount = Number(formatUnits(userData[0], decimals));
    const stableDebt = Number(formatUnits(userData[1], decimals));
    const variableDebt = Number(formatUnits(userData[2], decimals));
    const borrowedAmount = stableDebt + variableDebt;
    const priceUsdt = priceForSymbol(normalizedSymbol, prices);

    if (suppliedAmount > 0) {
      supplies.push({
        symbol: normalizedSymbol,
        amount: suppliedAmount,
        priceUsdt,
        collateralEnabled: userData[8]
      });
    }

    if (borrowedAmount > 0) {
      borrows.push({
        symbol: normalizedSymbol,
        amount: borrowedAmount,
        priceUsdt,
        variableBorrowApy: rayToPercent(reserveData[6])
      });
    }
  }

  return {
    walletAddress,
    market: 'Aave V3 Arbitrum',
    updatedAt: prices.updatedAt,
    btcPriceUsdt: prices.btcUsdt,
    supplies,
    borrows,
    usdtBrl: prices.usdtBrl
  };
}

function normalizeSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper === 'WBTC' || upper === 'BTC.B') return 'WBTC';
  if (upper === 'USD₮0' || upper === 'USDT0') return 'USDT';
  if (upper === 'USDC.E') return 'USDC';
  return upper;
}

function isSupportedPriceAsset(symbol: string): boolean {
  return ['WBTC', 'USDT', 'USDC', 'DAI'].includes(symbol);
}

function priceForSymbol(symbol: string, prices: PriceSnapshot): number {
  if (symbol === 'WBTC') return prices.btcUsdt;
  return 1;
}

function rayToPercent(ray: bigint): number {
  return Number(ray) / 1e25;
}
