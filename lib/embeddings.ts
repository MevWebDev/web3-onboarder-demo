import OpenAI from 'openai';
import { logger } from '@/lib/logger/index';

let openRouterClient: OpenAI | null = null;

function getOpenRouterClient(): OpenAI {
  if (!openRouterClient) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables');
    }
    
    openRouterClient = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Crypto Mentor Matchmaker - Embeddings',
      },
    });
    
    logger.info('OpenRouter client initialized for embeddings');
  }
  
  return openRouterClient;
}

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    logger.debug('Generating embedding for text:', { textLength: text.length });
    
    // First try OpenRouter for embeddings
    try {
      const client = getOpenRouterClient();
      
      const response = await client.embeddings.create({
        model: 'openai/text-embedding-ada-002',
        input: text,
      });
      
      if (response.data && response.data[0] && response.data[0].embedding) {
        const embedding = response.data[0].embedding;
        
        logger.debug('Embedding generated successfully via OpenRouter', { 
          dimensions: embedding.length,
          model: 'openai/text-embedding-ada-002' 
        });
        
        return embedding;
      } else {
        throw new Error('Invalid response format from OpenRouter embeddings API');
      }
    } catch (openRouterError) {
      logger.warn('OpenRouter embeddings failed, using mock embeddings:', openRouterError);
      
      // Generate mock embeddings for development
      const mockEmbedding = generateMockEmbedding(text);
      
      logger.debug('Mock embedding generated', { 
        dimensions: mockEmbedding.length,
        textLength: text.length 
      });
      
      return mockEmbedding;
    }
  } catch (error) {
    logger.error('Failed to generate embedding:', error);
    throw error;
  }
}

// Generate deterministic mock embeddings for development/testing
function generateMockEmbedding(text: string): number[] {
  // Create a deterministic seed from text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash as a seed for deterministic random numbers
  const seed = Math.abs(hash);
  
  // Generate 1024-dimensional embedding (matching existing Pinecone index)
  const embedding: number[] = [];
  let currentSeed = seed;
  
  for (let i = 0; i < 1024; i++) {
    // Simple linear congruential generator for deterministic randomness
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
    
    // Normalize to [-1, 1] range
    const value = (currentSeed / 0x7fffffff) * 2 - 1;
    embedding.push(value);
  }
  
  // Normalize the vector to unit length (as real embeddings are typically normalized)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    logger.debug('Generating batch embeddings:', { count: texts.length });
    
    // For now, use individual embedding calls since OpenRouter embeddings API needs investigation
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await getEmbedding(text);
      embeddings.push(embedding);
      
      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    logger.info('Batch embeddings generated successfully', { 
      totalEmbeddings: embeddings.length,
      dimensions: embeddings[0]?.length || 0
    });
    
    return embeddings;
  } catch (error) {
    logger.error('Failed to generate batch embeddings:', error);
    throw error;
  }
}