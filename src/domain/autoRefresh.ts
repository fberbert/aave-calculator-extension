export type RefreshState = 'idle' | 'loading' | 'ready' | 'error';

export const AUTO_REFRESH_INTERVAL_MS = 60_000;

export function canAutoRefresh(walletAddress: string | null, state: RefreshState): boolean {
  return state !== 'loading' && isEvmAddress(walletAddress);
}

export function getNextRefreshAt(lastRefreshAt: number): number {
  return lastRefreshAt + AUTO_REFRESH_INTERVAL_MS;
}

export function isEvmAddress(value: string | null | undefined): value is `0x${string}` {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value.trim()));
}
