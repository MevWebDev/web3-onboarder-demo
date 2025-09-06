import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from '@/lib/logger/index';

export interface PineconeIndexConfig {
  name: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  spec: {
    serverless: {
      cloud: 'aws' | 'gcp' | 'azure';
      region: string;
    };
  };
}

export interface CryptoMentorMetadata {
  // Personal info
  fullName: string;
  farcasterUsername?: string;
  fid?: string;
  timezone: string;
  bio: string;
  
  // Crypto expertise
  primaryArchetype: 'investor' | 'developer' | 'social_user';
  specializations: string[];
  yearsInCrypto: number;
  notableAchievements: string[];
  currentProjects: string[];
  blockchainExpertise: string[];
  
  // Mentoring approach
  teachingStyle: 'directive' | 'supportive' | 'coaching' | 'collaborative';
  teachingFocus: string[];
  communicationStyle: 'direct' | 'collaborative' | 'supportive' | 'challenging';
  preferredMenteeLevel: string[];
  
  // Availability
  isAvailable: boolean;
  availableDays: string[];
  availableTimes: string[];
  maxMentees: number;
  currentMentees: number;
  responseTime: 'immediate' | 'same_day' | 'next_day' | 'weekly';
  
  // Metrics
  successfulMentees: number;
  communityReputation: number;
  completionRate: number;
  
  // Search metadata
  searchKeywords: string[];
  profileType: 'mentor';
  createdAt: string;
}

class PineconeIndexManager {
  private client: Pinecone | null = null;
  private initialized = false;

  constructor() {
    // Client will be initialized lazily in initialize() method
  }

  async initialize() {
    if (this.initialized) return;
    
    // Initialize client if not already done
    if (!this.client) {
      const apiKey = process.env.PINECONE_API_KEY;
      if (!apiKey) {
        throw new Error('PINECONE_API_KEY is required but not found. Please check your environment variables.');
      }
      
      this.client = new Pinecone({
        apiKey: apiKey,
      });
    }
    
    try {
      logger.info('Initializing Pinecone index manager...');
      
      // Test connection
      const indexes = await this.client.listIndexes();
      logger.info('Connected to Pinecone successfully', { 
        indexCount: indexes.indexes?.length || 0 
      });
      
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize Pinecone:', error);
      throw error;
    }
  }

  async createIndexIfNotExists(config: PineconeIndexConfig): Promise<void> {
    await this.initialize();
    
    try {
      const indexes = await this.client.listIndexes();
      const existingIndex = indexes.indexes?.find(idx => idx.name === config.name);
      
      if (existingIndex) {
        logger.info(`Index ${config.name} already exists`, { 
          status: existingIndex.status?.state 
        });
        return;
      }

      logger.info(`Creating Pinecone index: ${config.name}...`);
      
      await this.client.createIndex({
        name: config.name,
        dimension: config.dimension,
        metric: config.metric,
        spec: config.spec,
      });

      // Wait for index to be ready
      await this.waitForIndexReady(config.name);
      
      logger.info(`Index ${config.name} created successfully`);
    } catch (error) {
      logger.error(`Failed to create index ${config.name}:`, error);
      throw error;
    }
  }

  async deleteIndex(indexName: string): Promise<void> {
    await this.initialize();
    
    try {
      logger.info(`Deleting Pinecone index: ${indexName}...`);
      await this.client.deleteIndex(indexName);
      logger.info(`Index ${indexName} deleted successfully`);
    } catch (error) {
      logger.error(`Failed to delete index ${indexName}:`, error);
      throw error;
    }
  }

  async getIndex(indexName: string) {
    await this.initialize();
    if (!this.client) {
      throw new Error('Pinecone client not initialized');
    }
    return this.client.Index(indexName);
  }

  async indexStats(indexName: string) {
    const index = await this.getIndex(indexName);
    return await index.describeIndexStats();
  }

  private async waitForIndexReady(indexName: string, maxWaitTime = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const indexes = await this.client.listIndexes();
        const index = indexes.indexes?.find(idx => idx.name === indexName);
        
        if (index?.status?.state === 'Ready') {
          logger.info(`Index ${indexName} is ready`);
          return;
        }
        
        logger.info(`Waiting for index ${indexName} to be ready...`, {
          state: index?.status?.state
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        logger.warn(`Error checking index status:`, error);
      }
    }
    
    throw new Error(`Index ${indexName} did not become ready within ${maxWaitTime}ms`);
  }

  // Namespace management for different archetype segregation
  async clearNamespace(indexName: string, namespace: string): Promise<void> {
    const index = await this.getIndex(indexName);
    
    try {
      await index.deleteAll(namespace);
      logger.info(`Cleared namespace ${namespace} in index ${indexName}`);
    } catch (error) {
      logger.error(`Failed to clear namespace ${namespace}:`, error);
      throw error;
    }
  }

  async getNamespaceStats(indexName: string, namespace: string) {
    const index = await this.getIndex(indexName);
    const stats = await index.describeIndexStats();
    return stats.namespaces?.[namespace] || { vectorCount: 0 };
  }
}

// Singleton instance
export const pineconeIndexManager = new PineconeIndexManager();

// Default configuration for crypto mentor index
export const cryptoMentorIndexConfig: PineconeIndexConfig = {
  name: process.env.PINECONE_INDEX_NAME || 'crypto-mentors',
  dimension: 1536, // OpenAI text-embedding-ada-002 dimensions
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-east-1',
    },
  },
};

// Namespace configuration for different archetypes
export const ARCHETYPE_NAMESPACES = {
  investor: 'mentors-investor',
  developer: 'mentors-developer',
  social_user: 'mentors-social-user',
  all: 'mentors-all', // Cross-archetype mentors
} as const;

export type ArchetypeNamespace = keyof typeof ARCHETYPE_NAMESPACES;