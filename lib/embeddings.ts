import OpenAI from 'openai';
import { logger } from '@/lib/logger/index';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    logger.info('OpenAI client initialized for embeddings');
  }
  
  return openaiClient;
}

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    logger.debug('Generating embedding for text:', { textLength: text.length });
    
    const client = getOpenAIClient();
    
    const response = await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    
    const embedding = response.data[0].embedding;
    
    logger.debug('Embedding generated successfully', { 
      dimensions: embedding.length,
      model: 'text-embedding-ada-002' 
    });
    
    return embedding;
  } catch (error) {
    logger.error('Failed to generate embedding:', error);
    throw error;
  }
}

export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    logger.debug('Generating batch embeddings:', { count: texts.length });
    
    const client = getOpenAIClient();
    
    // OpenAI has a limit on batch size, so we'll process in chunks if needed
    const maxBatchSize = 100;
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += maxBatchSize) {
      const batch = texts.slice(i, i + maxBatchSize);
      
      const response = await client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: batch,
      });
      
      embeddings.push(...response.data.map(item => item.embedding));
      
      logger.debug(`Processed embedding batch ${i / maxBatchSize + 1}`, {
        batchSize: batch.length,
        totalProcessed: embeddings.length,
      });
    }
    
    logger.info('Batch embeddings generated successfully', { 
      totalEmbeddings: embeddings.length 
    });
    
    return embeddings;
  } catch (error) {
    logger.error('Failed to generate batch embeddings:', error);
    throw error;
  }
}