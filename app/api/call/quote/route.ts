import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { redis } from '@/lib/redis';
import { fetchRedstonePrices } from '@/lib/redstone';
import { logger } from '@/lib/logger/index';

// Creates a price-locked quote for a call, priced in USD per minute and converted to ETH using RedStone.
// Body: { symbol?: string = 'ETH', usdPerMinute: number }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const symbol = (body.symbol || 'ETH').toUpperCase();
    const usdPerMinute = Number(body.usdPerMinute || 0.05); // default $0.05/min
    if (!Number.isFinite(usdPerMinute) || usdPerMinute <= 0) {
      return NextResponse.json({ error: 'Invalid usdPerMinute' }, { status: 400 });
    }

    const prices = await fetchRedstonePrices([symbol]);
    const p = prices[symbol];
    if (!p?.value) {
      return NextResponse.json({ error: 'Price not available' }, { status: 502 });
    }

    const usdPerEth = p.value; // ETH/USD
    const ethPerUsd = 1 / usdPerEth;
    const ethPerMinute = usdPerMinute * ethPerUsd;

    const quoteId = uuidv4();
    const createdAt = Date.now();
    const expiresAt = createdAt + 5 * 60 * 1000; // 5 minutes

    const record = {
      quoteId,
      symbol,
      usdPerMinute,
      startPriceUsd: usdPerEth,
      ethPerMinute,
      createdAt,
      expiresAt,
    };

    if (redis) {
      await redis.set(`quote:${quoteId}`, record, { ex: 15 * 60 }); // 15m TTL
    } else {
      logger.warn('Redis unavailable: quote stored ephemerally (no persistence)');
    }

    return NextResponse.json({ success: true, quote: record });
  } catch (error: any) {
    logger.error('Failed to create quote', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

