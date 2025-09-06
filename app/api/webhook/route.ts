// app/api/stream-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    console.log('=== Stream Token API Called ===');
    console.log('API Key:', apiKey ? `${apiKey.slice(0, 8)}...` : 'MISSING');
    console.log('API Secret:', apiSecret ? 'PRESENT' : 'MISSING');

    // Check if credentials are available
    if (!apiKey || !apiSecret) {
      console.error('Missing Stream credentials');
      return NextResponse.json(
        { 
          error: 'Stream API credentials not configured',
          details: {
            hasApiKey: !!apiKey,
            hasApiSecret: !!apiSecret,
            message: 'Please add NEXT_PUBLIC_STREAM_API_KEY and STREAM_API_SECRET to your .env.local file'
          }
        },
        { status: 500, headers }
      );
    }

    // Parse request body
    let userId;
    try {
      const body = await request.json();
      userId = body.userId;
      console.log('User ID received:', userId);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Expected JSON with userId field' },
        { status: 400, headers }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400, headers }
      );
    }

    // For development, create a simple token
    // In production, you'd use a proper JWT library
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: 'https://pronto.getstream.io',
      sub: `user/${userId}`,
      user_id: userId,
      iat: now,
      exp: now + (60 * 60 * 24), // 24 hours
    };

    // Simple base64 encoding for development
    // Note: This is a simplified approach for development
    const header = { typ: 'JWT', alg: 'HS256' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    // Create a simple signature using Node.js crypto
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    const token = `${encodedHeader}.${encodedPayload}.${signature}`;
    
    console.log('Token generated successfully for user:', userId);

    return NextResponse.json(
      { 
        success: true,
        token,
        userId,
        apiKey: apiKey.slice(0, 8) + '...' // Don't expose full API key
      },
      { headers }
    );

  } catch (error) {
    console.error('Stream token generation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : 'No stack') : undefined
      },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}