import { NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone/client';
import { logger } from '@/lib/logger/index';

export async function POST() {
  try {
    logger.info('Testing Pinecone connection...');
    
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not configured');
    }

    const client = await getPineconeClient();
    
    // List indexes to verify connection
    const indexes = await client.listIndexes();
    
    logger.info('Pinecone test successful:', { 
      indexCount: indexes.indexes?.length || 0,
      indexes: indexes.indexes?.map(idx => idx.name)
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Pinecone connection successful',
      indexes: indexes.indexes?.map(idx => idx.name) || []
    });
  } catch (error: any) {
    logger.error('Pinecone test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to connect to Pinecone'
    }, { status: 500 });
  }
}