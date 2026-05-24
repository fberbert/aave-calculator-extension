export function formatMoney(value: number, currency: 'USDT' | 'BRL' = 'USDT'): string {
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  const options: Intl.NumberFormatOptions =
    currency === 'BRL'
      ? { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const formatted = new Intl.NumberFormat(locale, options).format(value);
  return currency === 'USDT' ? `${formatted} USDT` : formatted;
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)}%`;
}

export function formatCrypto(value: number, symbol: string): string {
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(value)} ${symbol}`;
}
