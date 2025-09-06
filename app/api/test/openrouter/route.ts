import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getModel } from '@/lib/openrouter/config';
import { logger } from '@/lib/logger/index';

export async function POST() {
  try {
    logger.info('Testing OpenRouter connection...');
    
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const model = getModel('fast');
    
    const { text } = await generateText({
      model,
      prompt: 'Say "OpenRouter connection successful" in exactly 4 words.',
      maxTokens: 10,
    });

    logger.info('OpenRouter test successful:', { response: text });
    
    return NextResponse.json({ 
      success: true, 
      message: text,
      model: 'openai/gpt-3.5-turbo'
    });
  } catch (error: any) {
    logger.error('OpenRouter test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to connect to OpenRouter'
    }, { status: 500 });
  }
}