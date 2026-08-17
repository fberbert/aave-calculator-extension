import { describe, expect, it } from 'vitest';
import { formatFixedBtc } from '../domain/formatters';

describe('formatters', () => {
  it('formats BTC balances with eight decimal places', () => {
    expect(formatFixedBtc(0.51919275)).toBe('0.51919275 BTC');
    expect(formatFixedBtc(0.00608045)).toBe('0.00608045 BTC');
    expect(formatFixedBtc(0.5)).toBe('0.50000000 BTC');
  });
});
