import { NextResponse } from 'next/server';
import { fetchRedstonePrices } from '@/lib/redstone';
import { logger } from '@/lib/logger/index';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols') || 'ETH,BTC';
    const symbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean);

    const data = await fetchRedstonePrices(symbols);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logger.error('Failed to fetch RedStone prices', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

