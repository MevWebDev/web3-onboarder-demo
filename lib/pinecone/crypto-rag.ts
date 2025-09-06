import { 
  pineconeIndexManager, 
  CryptoMentorMetadata 
} from './index-manager';
import { CryptoNewcomerProfile } from '@/lib/types/interview';
import { getEmbedding } from '@/lib/embeddings';
import { logger } from '@/lib/logger/index';

export interface CryptoEducationContent {
  id: string;
  title: string;
  content: string;
  category: 'fundamentals' | 'defi' | 'development' | 'trading' | 'dao' | 'security' | 'nft';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  archetype: 'investor' | 'developer' | 'social_user' | 'all';
  keywords: string[];
  estimatedReadTime: number;
  prerequisites: string[];
}

export interface RAGContext {
  query: string;
  userProfile: CryptoNewcomerProfile;
  relevantContent: CryptoEducationContent[];
  mentorInsights: string[];
  learningPathSuggestions: string[];
}

export interface RAGResponse {
  answer: string;
  sources: CryptoEducationContent[];
  confidence: number;
  nextSteps: string[];
  relatedTopics: string[];
}

export class CryptoPineconeRAG {
  private contentIndexName: string;
  private mentorIndexName: string;

  constructor(
    contentIndexName = 'crypto-education',
    mentorIndexName = 'crypto-mentors'
  ) {
    this.contentIndexName = contentIndexName;
    this.mentorIndexName = mentorIndexName;
  }

  /**
   * Create educational content vectors and store in Pinecone
   */
  async indexEducationalContent(content: CryptoEducationContent[]): Promise<void> {
    try {
      logger.info('Starting educational content indexing', { count: content.length });
      
      const index = await pineconeIndexManager.getIndex(this.contentIndexName);
      
      // Generate vectors for content
      const vectors = await Promise.all(content.map(async (item, i) => {
        const searchText = this.buildContentSearchText(item);
        const embedding = await getEmbedding(searchText);
        
        return {
          id: `content_${item.id}`,
          values: embedding,
          metadata: {
            title: item.title,
            category: item.category,
            difficulty: item.difficulty,
            archetype: item.archetype,
            keywords: item.keywords,
            estimatedReadTime: item.estimatedReadTime,
            prerequisites: item.prerequisites,
            contentPreview: item.content.substring(0, 500),
          }
        };
      }));

      // Upload in batches
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.namespace('education').upsert(batch);
        
        logger.info(`Uploaded content batch ${Math.floor(i / batchSize) + 1}`, {
          batchSize: batch.length
        });
        
        // Rate limiting
        if (i + batchSize < vectors.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info('Educational content indexing completed', {
        totalVectors: vectors.length
      });

    } catch (error) {
      logger.error('Educational content indexing failed:', error);
      throw error;
    }
  }

  /**
   * Build search text from educational content
   */
  private buildContentSearchText(content: CryptoEducationContent): string {
    return [
      content.title,
      content.content,
      `${content.category} ${content.difficulty}`,
      `for ${content.archetype} archetype`,
      content.keywords.join(' '),
      content.prerequisites.join(' ')
    ].filter(Boolean).join(' ');
  }

  /**
   * Retrieve relevant educational content based on user query and profile
   */
  async retrieveRelevantContent(
    query: string,
    userProfile: CryptoNewcomerProfile,
    maxResults = 5
  ): Promise<CryptoEducationContent[]> {
    try {
      logger.info('Retrieving relevant educational content', {
        query: query.substring(0, 100),
        userArchetype: userProfile.archetype_classification.primary_archetype,
        knowledgeLevel: userProfile.crypto_interests.knowledge_level
      });

      const index = await pineconeIndexManager.getIndex(this.contentIndexName);
      
      // Generate query embedding
      const enhancedQuery = this.enhanceQueryWithProfile(query, userProfile);
      const queryEmbedding = await getEmbedding(enhancedQuery);

      // Build metadata filters based on user profile
      const filter = this.buildContentFilters(userProfile);

      // Search for relevant content
      const searchResults = await index.namespace('education').query({
        vector: queryEmbedding,
        topK: maxResults * 2, // Get more to filter
        filter,
        includeMetadata: true,
      });

      // Convert results and filter by relevance
      const relevantContent: CryptoEducationContent[] = (searchResults.matches || [])
        .filter(match => (match.score || 0) > 0.7) // High similarity threshold
        .slice(0, maxResults)
        .map(match => ({
          id: match.id.replace('content_', ''),
          title: match.metadata?.title as string,
          content: match.metadata?.contentPreview as string,
          category: match.metadata?.category as any,
          difficulty: match.metadata?.difficulty as any,
          archetype: match.metadata?.archetype as any,
          keywords: match.metadata?.keywords as string[],
          estimatedReadTime: match.metadata?.estimatedReadTime as number,
          prerequisites: match.metadata?.prerequisites as string[],
        }));

      logger.info('Content retrieval completed', {
        foundResults: relevantContent.length,
        avgScore: searchResults.matches?.reduce((sum, m) => sum + (m.score || 0), 0) / (searchResults.matches?.length || 1)
      });

      return relevantContent;

    } catch (error) {
      logger.error('Content retrieval failed:', error);
      return [];
    }
  }

  /**
   * Enhance user query with profile context for better matching
   */
  private enhanceQueryWithProfile(query: string, profile: CryptoNewcomerProfile): string {
    const enhancements = [
      query,
      `${profile.archetype_classification.primary_archetype} perspective`,
      `${profile.crypto_interests.knowledge_level} level`,
      profile.crypto_interests.primary_goals.join(' '),
      profile.crypto_interests.specific_interests.join(' '),
      profile.learning_preferences.learning_style.join(' ')
    ];

    return enhancements.filter(Boolean).join(' ');
  }

  /**
   * Build content filters based on user profile
   */
  private buildContentFilters(profile: CryptoNewcomerProfile): any {
    const filters: any = {
      $and: []
    };

    // Filter by appropriate difficulty level
    const knowledgeLevel = profile.crypto_interests.knowledge_level;
    const allowedDifficulties = this.getAllowedDifficulties(knowledgeLevel);
    
    filters.$and.push({
      difficulty: { $in: allowedDifficulties }
    });

    // Filter by archetype relevance
    filters.$and.push({
      $or: [
        { archetype: { $eq: profile.archetype_classification.primary_archetype } },
        { archetype: { $eq: 'all' } }
      ]
    });

    return filters.$and.length > 0 ? filters : {};
  }

  /**
   * Get allowed difficulty levels based on user knowledge
   */
  private getAllowedDifficulties(knowledgeLevel: string): string[] {
    switch (knowledgeLevel) {
      case 'beginner':
        return ['beginner'];
      case 'intermediate': 
        return ['beginner', 'intermediate'];
      case 'advanced':
        return ['intermediate', 'advanced'];
      case 'expert':
        return ['advanced'];
      default:
        return ['beginner'];
    }
  }

  /**
   * Get mentor insights for specific topics from mentor knowledge base
   */
  async getMentorInsights(
    topic: string,
    userArchetype: string,
    maxInsights = 3
  ): Promise<string[]> {
    try {
      const index = await pineconeIndexManager.getIndex(this.mentorIndexName);
      
      // Create topic-specific query
      const queryText = `${topic} ${userArchetype} mentoring advice guidance expertise`;
      const queryEmbedding = await getEmbedding(queryText);

      // Search for mentors with relevant expertise
      const results = await index.namespace('mentors-all').query({
        vector: queryEmbedding,
        topK: 10,
        filter: {
          communityReputation: { $gte: 7 }, // High-quality mentors only
          isAvailable: { $eq: true }
        },
        includeMetadata: true,
      });

      const insights: string[] = [];
      
      for (const match of (results.matches || []).slice(0, maxInsights)) {
        const metadata = match.metadata as CryptoMentorMetadata;
        if (metadata.notableAchievements.length > 0) {
          const insight = `According to ${metadata.fullName} (${metadata.yearsInCrypto} years experience): ${metadata.notableAchievements[0]}`;
          insights.push(insight);
        }
      }

      return insights;

    } catch (error) {
      logger.error('Failed to get mentor insights:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive RAG response for user query
   */
  async generateRAGResponse(
    query: string,
    userProfile: CryptoNewcomerProfile,
    conversationContext?: string[]
  ): Promise<RAGResponse> {
    try {
      logger.info('Generating RAG response', {
        query: query.substring(0, 100),
        userArchetype: userProfile.archetype_classification.primary_archetype
      });

      // Retrieve relevant content and mentor insights
      const [relevantContent, mentorInsights] = await Promise.all([
        this.retrieveRelevantContent(query, userProfile),
        this.getMentorInsights(
          query, 
          userProfile.archetype_classification.primary_archetype
        )
      ]);

      // Build context for AI response generation
      const context: RAGContext = {
        query,
        userProfile,
        relevantContent,
        mentorInsights,
        learningPathSuggestions: this.generateLearningPathSuggestions(
          query, 
          userProfile, 
          relevantContent
        )
      };

      // Generate AI response using retrieved context
      const response = await this.synthesizeResponse(context, conversationContext);

      logger.info('RAG response generated', {
        sourcesCount: relevantContent.length,
        confidence: response.confidence,
        hasInsights: mentorInsights.length > 0
      });

      return response;

    } catch (error) {
      logger.error('RAG response generation failed:', error);
      
      // Return fallback response
      return {
        answer: "I apologize, but I'm having trouble accessing educational resources right now. Please try asking your question again, or consider connecting with one of our mentors for personalized guidance.",
        sources: [],
        confidence: 0.1,
        nextSteps: ["Try rephrasing your question", "Connect with a mentor for personalized help"],
        relatedTopics: []
      };
    }
  }

  /**
   * Generate learning path suggestions based on query and content
   */
  private generateLearningPathSuggestions(
    query: string,
    profile: CryptoNewcomerProfile,
    content: CryptoEducationContent[]
  ): string[] {
    const suggestions: string[] = [];
    
    const archetype = profile.archetype_classification.primary_archetype;
    const level = profile.crypto_interests.knowledge_level;

    // Base suggestions by archetype
    const archetypeSuggestions = {
      investor: [
        "Start with crypto fundamentals and market analysis",
        "Learn about DeFi protocols and yield strategies",
        "Understand portfolio management and risk assessment"
      ],
      developer: [
        "Begin with blockchain fundamentals and Solidity",
        "Practice smart contract development and testing",
        "Study security best practices and audit techniques"
      ],
      social_user: [
        "Explore DAO governance and community building",
        "Learn about NFTs and social token economics",
        "Understand web3 social platforms and protocols"
      ]
    };

    // Add archetype-specific suggestions
    suggestions.push(...(archetypeSuggestions[archetype] || []));

    // Add content-specific suggestions based on retrieved materials
    const contentCategories = [...new Set(content.map(c => c.category))];
    for (const category of contentCategories) {
      suggestions.push(`Deep dive into ${category} topics`);
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Synthesize final response using retrieved context
   */
  private async synthesizeResponse(
    context: RAGContext,
    conversationContext?: string[]
  ): Promise<RAGResponse> {
    // For now, create a structured response based on retrieved content
    // In production, this would use an LLM to synthesize the information
    
    const { relevantContent, mentorInsights, userProfile } = context;
    
    let answer = `Based on your ${userProfile.archetype_classification.primary_archetype} profile and ${userProfile.crypto_interests.knowledge_level} knowledge level, here's what I found:\n\n`;

    // Add content-based information
    if (relevantContent.length > 0) {
      answer += "Key topics to explore:\n";
      relevantContent.forEach((content, i) => {
        answer += `${i + 1}. ${content.title} (${content.difficulty} level, ~${content.estimatedReadTime} min read)\n`;
      });
      answer += "\n";
    }

    // Add mentor insights
    if (mentorInsights.length > 0) {
      answer += "Expert insights:\n";
      mentorInsights.forEach((insight, i) => {
        answer += `• ${insight}\n`;
      });
      answer += "\n";
    }

    // Calculate confidence based on available information
    const confidence = Math.min(
      0.9,
      0.3 + (relevantContent.length * 0.15) + (mentorInsights.length * 0.1)
    );

    // Generate next steps
    const nextSteps = [
      ...context.learningPathSuggestions.slice(0, 2),
      relevantContent.length > 0 ? "Review the recommended educational materials" : "",
      "Connect with a mentor for personalized guidance"
    ].filter(Boolean);

    // Extract related topics from content
    const relatedTopics = [
      ...new Set(relevantContent.flatMap(c => c.keywords).slice(0, 5))
    ];

    return {
      answer,
      sources: relevantContent,
      confidence,
      nextSteps,
      relatedTopics
    };
  }

  /**
   * Get content recommendations based on user's learning progress
   */
  async getPersonalizedRecommendations(
    userProfile: CryptoNewcomerProfile,
    completedContent: string[] = [],
    maxRecommendations = 5
  ): Promise<CryptoEducationContent[]> {
    try {
      // Build query based on user interests and gaps
      const interestQuery = [
        ...userProfile.crypto_interests.primary_goals,
        ...userProfile.crypto_interests.specific_interests,
        'next steps learning path progression'
      ].join(' ');

      const recommendations = await this.retrieveRelevantContent(
        interestQuery,
        userProfile,
        maxRecommendations * 2
      );

      // Filter out already completed content
      const filteredRecommendations = recommendations.filter(
        content => !completedContent.includes(content.id)
      );

      return filteredRecommendations.slice(0, maxRecommendations);

    } catch (error) {
      logger.error('Failed to get personalized recommendations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const cryptoPineconeRAG = new CryptoPineconeRAG();

// Sample educational content for testing
export const sampleEducationalContent: CryptoEducationContent[] = [
  {
    id: 'defi-101',
    title: 'DeFi Fundamentals: Understanding Decentralized Finance',
    content: 'Decentralized Finance (DeFi) represents a paradigm shift from traditional financial systems...',
    category: 'defi',
    difficulty: 'beginner',
    archetype: 'investor',
    keywords: ['defi', 'decentralized finance', 'liquidity', 'yield', 'protocols'],
    estimatedReadTime: 15,
    prerequisites: ['crypto-basics', 'wallet-management']
  },
  {
    id: 'solidity-basics',
    title: 'Smart Contract Development with Solidity',
    content: 'Solidity is the primary programming language for Ethereum smart contracts...',
    category: 'development',
    difficulty: 'intermediate',
    archetype: 'developer',
    keywords: ['solidity', 'smart contracts', 'ethereum', 'development', 'programming'],
    estimatedReadTime: 25,
    prerequisites: ['blockchain-basics', 'programming-fundamentals']
  },
  {
    id: 'dao-governance',
    title: 'DAO Governance and Community Building',
    content: 'Decentralized Autonomous Organizations (DAOs) represent a new form of collective organization...',
    category: 'dao',
    difficulty: 'intermediate',
    archetype: 'social_user',
    keywords: ['dao', 'governance', 'community', 'voting', 'proposals'],
    estimatedReadTime: 20,
    prerequisites: ['crypto-basics', 'tokenomics']
  },
  {
    id: 'crypto-security',
    title: 'Crypto Security Best Practices',
    content: 'Security is paramount in the crypto space. Understanding how to protect your assets...',
    category: 'security',
    difficulty: 'beginner',
    archetype: 'all',
    keywords: ['security', 'wallet', 'private keys', 'phishing', 'best practices'],
    estimatedReadTime: 12,
    prerequisites: []
  },
  {
    id: 'nft-ecosystem',
    title: 'Understanding the NFT Ecosystem',
    content: 'Non-Fungible Tokens (NFTs) have created new possibilities for digital ownership...',
    category: 'nft',
    difficulty: 'beginner',
    archetype: 'social_user',
    keywords: ['nft', 'digital art', 'collectibles', 'marketplaces', 'metadata'],
    estimatedReadTime: 18,
    prerequisites: ['crypto-basics']
  }
];