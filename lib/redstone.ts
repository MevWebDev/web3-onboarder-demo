import { logger } from '@/lib/logger/index';

export type RedstonePrice = {
  value: number; // price in USD
  timestamp: number; // ms epoch
  version?: string;
  provider?: string;
};

const REDSTONE_API = 'https://api.redstone.finance/prices';

/**
 * Fetch latest RedStone prices for given symbols.
 * Tries primary prod service first, falls back to main demo if needed.
 */
export async function fetchRedstonePrices(
  symbols: string[],
  dataServiceId: 'redstone-primary-prod' | 'redstone-main-demo' = 'redstone-primary-prod',
): Promise<Record<string, RedstonePrice>> {
  const symbolParam = symbols.join(',');
  const url = `${REDSTONE_API}?symbols=${encodeURIComponent(symbolParam)}&provider=${dataServiceId}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`RedStone API error: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    // Expected shape: { SYMBOL: { value, timestamp, ... }, ... }
    if (!json || typeof json !== 'object') {
      throw new Error('Unexpected RedStone response');
    }
    return json as Record<string, RedstonePrice>;
  } catch (err) {
    logger.warn('RedStone primary service failed, trying demo', { err: (err as Error).message });
    if (dataServiceId === 'redstone-primary-prod') {
      return fetchRedstonePrices(symbols, 'redstone-main-demo');
    }
    throw err;
  }
}

export function normalizeUsd(value: number): number {
  // Ensure finite positive
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value;
}

