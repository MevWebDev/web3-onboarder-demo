import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { fetchRedstonePrices } from '@/lib/redstone';
import { logger } from '@/lib/logger/index';

// Settles a call by computing owed ETH based on duration and end price snapshot for info (no on-chain tx here).
// Body: { quoteId: string, durationSeconds: number, symbol?: string = 'ETH' }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quoteId } = body as { quoteId: string };
    const symbol = (body.symbol || 'ETH').toUpperCase();
    const durationSeconds = Number(body.durationSeconds || 0);
    if (!quoteId) return NextResponse.json({ error: 'quoteId required' }, { status: 400 });
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return NextResponse.json({ error: 'Invalid durationSeconds' }, { status: 400 });
    }

    let quote: any = null;
    if (redis) {
      quote = await redis.get(`quote:${quoteId}`);
    }

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found or expired' }, { status: 404 });
    }

    const minutes = Math.ceil(durationSeconds / 60);
    const ethDue = quote.ethPerMinute * minutes;

    // For transparency, fetch end price snapshot
    const prices = await fetchRedstonePrices([symbol]);
    const endPriceUsd = prices[symbol]?.value;

    const result = {
      symbol,
      quoteId,
      minutes,
      usdPerMinute: quote.usdPerMinute,
      startPriceUsd: quote.startPriceUsd,
      endPriceUsd,
      ethPerMinute: quote.ethPerMinute,
      ethDue,
      settledAt: Date.now(),
    };

    return NextResponse.json({ success: true, settlement: result });
  } catch (error: any) {
    logger.error('Failed to settle call', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

