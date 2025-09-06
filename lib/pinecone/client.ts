import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from '@/lib/logger/index';

let pineconeClient: Pinecone | null = null;

export async function getPineconeClient(): Promise<Pinecone> {
  if (pineconeClient) {
    return pineconeClient;
  }

  try {
    logger.info('Initializing Pinecone client...');
    
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set in environment variables');
    }

    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    logger.info('Pinecone client initialized successfully');
    return pineconeClient;
  } catch (error) {
    logger.error('Failed to initialize Pinecone client:', error);
    throw error;
  }
}

export async function getPineconeIndex(indexName?: string) {
  const client = await getPineconeClient();
  const index = indexName || process.env.PINECONE_INDEX_NAME || 'crypto-mentors';
  
  logger.debug(`Getting Pinecone index: ${index}`);
  
  try {
    const pineconeIndex = client.Index(index);
    logger.debug(`Successfully connected to index: ${index}`);
    return pineconeIndex;
  } catch (error) {
    logger.error(`Failed to get Pinecone index ${index}:`, error);
    throw error;
  }
}