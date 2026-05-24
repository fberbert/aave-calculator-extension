import { describe, expect, it } from 'vitest';
import { canAutoRefresh, getNextRefreshAt, AUTO_REFRESH_INTERVAL_MS } from '../domain/autoRefresh';

describe('auto refresh rules', () => {
  it('only refreshes automatically with a valid EVM wallet and when not already loading', () => {
    expect(canAutoRefresh('0x0000000000000000000000000000000000000001', 'ready')).toBe(true);
    expect(canAutoRefresh('0x0000000000000000000000000000000000000001', 'loading')).toBe(false);
    expect(canAutoRefresh('', 'ready')).toBe(false);
    expect(canAutoRefresh('not-a-wallet', 'ready')).toBe(false);
  });

  it('schedules the next refresh from the last completed refresh time', () => {
    expect(getNextRefreshAt(1000)).toBe(1000 + AUTO_REFRESH_INTERVAL_MS);
  });
});
