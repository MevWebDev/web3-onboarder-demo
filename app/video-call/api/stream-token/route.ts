// app/api/stream-token/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

// Simple JWT token generation without external dependencies
function generateStreamToken(userId: string, apiSecret: string): string {
  const header = {
    typ: 'JWT',
    alg: 'HS256'
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (60 * 60); // 1 hour expiration

  const payload = {
    user_id: userId,
    iat: now,
    exp: exp,
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');

  return `${base64Header}.${base64Payload}.${signature}`;
}

export async function POST(request: Request) {
  try {
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Stream API credentials not configured' },
        { status: 500 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate token manually
    const token = generateStreamToken(userId, apiSecret);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating Stream token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}