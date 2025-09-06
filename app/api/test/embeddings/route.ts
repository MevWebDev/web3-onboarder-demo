import { NextResponse } from 'next/server';
import { getEmbedding } from '@/lib/embeddings';
import { logger } from '@/lib/logger/index';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    logger.info('Testing OpenAI embeddings...', { text });
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const embedding = await getEmbedding(text || 'Test embedding generation');
    
    logger.info('Embeddings test successful:', { 
      dimensions: embedding.length,
      sample: embedding.slice(0, 5)
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Embeddings generation successful',
      dimensions: embedding.length,
      sample: embedding.slice(0, 5)
    });
  } catch (error: any) {
    logger.error('Embeddings test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate embeddings'
    }, { status: 500 });
  }
}