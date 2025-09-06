import { 
  pineconeIndexManager, 
  ARCHETYPE_NAMESPACES,
  CryptoMentorMetadata 
} from './index-manager';
import { CryptoNewcomerProfile, ArchetypeClassification } from '@/lib/types/interview';
import { getEmbedding } from '@/lib/embeddings';
import { logger } from '@/lib/logger/index';

export interface SearchPreferences {
  maxResults?: number;
  minScore?: number;
  includeMetadata?: boolean;
  preferredArchetypes?: ('investor' | 'developer' | 'social_user')[];
  experienceRange?: {
    min?: number;
    max?: number;
  };
  availabilityRequired?: boolean;
  responseTimePreference?: ('immediate' | 'same_day' | 'next_day' | 'weekly')[];
}

export interface CryptoMatchResult {
  id: string;
  score: number;
  metadata: CryptoMentorMetadata;
  matchExplanation: string;
  searchStrategy: string;
  archetypeAlignment: number;
  learningPathSuggestion?: string;
}

export class CryptoHybridSearch {
  private indexName: string;

  constructor(indexName = 'crypto-mentors') {
    this.indexName = indexName;
  }

  /**
   * Build search query from newcomer profile
   */
  buildSearchQuery(profile: CryptoNewcomerProfile): string {
    const queryParts = [
      // Primary goals and interests
      profile.crypto_interests.primary_goals.join(' '),
      
      // Specific crypto interests
      profile.crypto_interests.specific_interests.join(' '),
      
      // Entry motivation
      profile.crypto_interests.entry_motivation.join(' '),
      
      // Learning preferences
      profile.learning_preferences.learning_style.join(' '),
      
      // Mentor requirements
      profile.mentor_requirements.desired_expertise.join(' '),
      
      // Current background context
      `${profile.current_background.role} ${profile.current_background.industry}`,
      
      // Archetype context
      `${profile.archetype_classification.primary_archetype} crypto mentoring`,
      
      // Knowledge level
      `${profile.crypto_interests.knowledge_level} level`,
      
      // Technical proficiency
      `${profile.current_background.technical_proficiency} technical background`,
    ];

    return queryParts.filter(Boolean).join(' ');
  }

  /**
   * Build metadata filters based on newcomer profile and preferences
   */
  buildMetadataFilters(
    profile: CryptoNewcomerProfile, 
    preferences: SearchPreferences = {}
  ): any {
    const filters: any = {
      $and: []
    };

    // Always filter for available mentors
    if (preferences.availabilityRequired !== false) {
      filters.$and.push({ isAvailable: { $eq: true } });
    }

    // Experience range filtering
    if (preferences.experienceRange) {
      if (preferences.experienceRange.min !== undefined) {
        filters.$and.push({ yearsInCrypto: { $gte: preferences.experienceRange.min } });
      }
      if (preferences.experienceRange.max !== undefined) {
        filters.$and.push({ yearsInCrypto: { $lte: preferences.experienceRange.max } });
      }
    }

    // Response time preference
    if (preferences.responseTimePreference && preferences.responseTimePreference.length > 0) {
      filters.$and.push({ responseTime: { $in: preferences.responseTimePreference } });
    }

    // Specialization matching
    if (profile.mentor_requirements.desired_expertise.length > 0) {
      const expertiseFilter = {
        $or: profile.mentor_requirements.desired_expertise.map(expertise => ({
          specializations: { $in: [expertise] }
        }))
      };
      filters.$and.push(expertiseFilter);
    }

    // Communication style compatibility
    const compatibleStyles = this.getCompatibleCommunicationStyles(
      profile.learning_preferences.communication_style
    );
    filters.$and.push({ communicationStyle: { $in: compatibleStyles } });

    // Mentee level matching
    const menteeLevel = this.inferMenteeLevel(profile);
    filters.$and.push({ preferredMenteeLevel: { $in: [menteeLevel] } });

    return filters.$and.length > 0 ? filters : {};
  }

  /**
   * Get compatible communication styles based on user preference
   */
  private getCompatibleCommunicationStyles(userStyle: string): string[] {
    const compatibility: { [key: string]: string[] } = {
      direct: ['direct', 'challenging'],
      collaborative: ['collaborative', 'supportive', 'direct'],
      supportive: ['supportive', 'collaborative'],
      challenging: ['challenging', 'direct', 'collaborative'],
    };

    return compatibility[userStyle] || [userStyle];
  }

  /**
   * Infer mentee level from profile
   */
  private inferMenteeLevel(profile: CryptoNewcomerProfile): string {
    const knowledgeLevel = profile.crypto_interests.knowledge_level;
    const experienceLevel = profile.current_background.previous_crypto_experience;

    if (knowledgeLevel === 'expert' || experienceLevel === 'experienced') {
      return 'advanced';
    } else if (knowledgeLevel === 'advanced' || experienceLevel === 'active') {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  /**
   * Multi-strategy hybrid search for optimal mentor matching
   */
  async searchCryptoMentors(
    profile: CryptoNewcomerProfile,
    preferences: SearchPreferences = {}
  ): Promise<CryptoMatchResult[]> {
    try {
      logger.info('Starting crypto mentor search', {
        profileId: profile.id,
        archetype: profile.archetype_classification.primary_archetype,
        preferences
      });

      const index = await pineconeIndexManager.getIndex(this.indexName);
      const queryText = this.buildSearchQuery(profile);
      const queryEmbedding = await getEmbedding(queryText);
      const baseFilters = this.buildMetadataFilters(profile, preferences);

      const allResults: CryptoMatchResult[] = [];

      // Strategy 1: Exact archetype match with high similarity
      const exactArchetypeResults = await this.searchByStrategy(
        index,
        queryEmbedding,
        ARCHETYPE_NAMESPACES[profile.archetype_classification.primary_archetype],
        {
          ...baseFilters,
          $and: [
            ...(baseFilters.$and || []),
            { primaryArchetype: { $eq: profile.archetype_classification.primary_archetype } }
          ]
        },
        10,
        'exact-archetype',
        profile,
        0.5
      );
      allResults.push(...exactArchetypeResults);

      // Strategy 2: Cross-archetype mentors with overlapping skills
      const crossArchetypeResults = await this.searchByStrategy(
        index,
        queryEmbedding,
        ARCHETYPE_NAMESPACES.all,
        {
          ...baseFilters,
          $and: [
            ...(baseFilters.$and || []),
            { primaryArchetype: { $ne: profile.archetype_classification.primary_archetype } }
          ]
        },
        5,
        'cross-archetype',
        profile,
        0.3
      );
      allResults.push(...crossArchetypeResults);

      // Strategy 3: High-reputation mentors regardless of exact match
      const highReputationResults = await this.searchByStrategy(
        index,
        queryEmbedding,
        ARCHETYPE_NAMESPACES.all,
        {
          ...baseFilters,
          $and: [
            ...(baseFilters.$and || []),
            { communityReputation: { $gte: 8 } },
            { successfulMentees: { $gte: 10 } }
          ]
        },
        5,
        'high-reputation',
        profile,
        0.2
      );
      allResults.push(...highReputationResults);

      // Deduplicate results by mentor ID
      const deduplicatedResults = this.deduplicateResults(allResults);

      // Sort by weighted score and return top results
      const maxResults = preferences.maxResults || 5;
      const minScore = preferences.minScore || 0.3;
      
      const finalResults = deduplicatedResults
        .filter(result => result.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      logger.info('Crypto mentor search completed', {
        totalResults: allResults.length,
        deduplicatedResults: deduplicatedResults.length,
        finalResults: finalResults.length,
        avgScore: finalResults.reduce((sum, r) => sum + r.score, 0) / finalResults.length || 0
      });

      return finalResults;

    } catch (error) {
      logger.error('Crypto mentor search failed:', error);
      throw error;
    }
  }

  /**
   * Execute search strategy with specific parameters
   */
  private async searchByStrategy(
    index: any,
    queryEmbedding: number[],
    namespace: string,
    filter: any,
    topK: number,
    strategy: string,
    profile: CryptoNewcomerProfile,
    weight: number
  ): Promise<CryptoMatchResult[]> {
    try {
      const results = await index.namespace(namespace).query({
        vector: queryEmbedding,
        topK,
        filter,
        includeMetadata: true,
      });

      return (results.matches || []).map((match: any) => ({
        id: match.id,
        score: (match.score || 0) * weight,
        metadata: match.metadata as CryptoMentorMetadata,
        matchExplanation: this.generateMatchExplanation(profile, match.metadata, match.score),
        searchStrategy: strategy,
        archetypeAlignment: this.calculateArchetypeAlignment(
          profile.archetype_classification.primary_archetype,
          match.metadata.primaryArchetype
        ),
        learningPathSuggestion: this.generateLearningPathSuggestion(profile, match.metadata),
      }));

    } catch (error) {
      logger.warn(`Search strategy ${strategy} failed:`, error);
      return [];
    }
  }

  /**
   * Remove duplicate mentors from results, keeping highest score
   */
  private deduplicateResults(results: CryptoMatchResult[]): CryptoMatchResult[] {
    const mentorMap = new Map<string, CryptoMatchResult>();

    for (const result of results) {
      const existing = mentorMap.get(result.id);
      if (!existing || result.score > existing.score) {
        mentorMap.set(result.id, result);
      }
    }

    return Array.from(mentorMap.values());
  }

  /**
   * Generate match explanation based on compatibility factors
   */
  private generateMatchExplanation(
    profile: CryptoNewcomerProfile,
    mentorMetadata: CryptoMentorMetadata,
    similarityScore: number
  ): string {
    const explanations: string[] = [];

    // Archetype alignment
    if (profile.archetype_classification.primary_archetype === mentorMetadata.primaryArchetype) {
      explanations.push(`Perfect archetype match - both ${profile.archetype_classification.primary_archetype}s`);
    } else {
      explanations.push(`Complementary cross-archetype expertise between ${profile.archetype_classification.primary_archetype} and ${mentorMetadata.primaryArchetype}`);
    }

    // Expertise overlap
    const userExpertise = profile.mentor_requirements.desired_expertise;
    const mentorSpecializations = mentorMetadata.specializations;
    const overlap = userExpertise.filter(exp => 
      mentorSpecializations.some(spec => 
        spec.toLowerCase().includes(exp.toLowerCase()) || 
        exp.toLowerCase().includes(spec.toLowerCase())
      )
    );

    if (overlap.length > 0) {
      explanations.push(`Strong expertise match in ${overlap.slice(0, 2).join(', ')}`);
    }

    // Experience relevance
    const menteeLevel = this.inferMenteeLevel(profile);
    if (mentorMetadata.preferredMenteeLevel.includes(menteeLevel)) {
      explanations.push(`Excellent fit for ${menteeLevel} level mentees`);
    }

    // High reputation
    if (mentorMetadata.communityReputation >= 9) {
      explanations.push(`Highly regarded mentor with ${mentorMetadata.successfulMentees}+ successful mentorships`);
    }

    // Communication compatibility
    const compatibleStyles = this.getCompatibleCommunicationStyles(profile.learning_preferences.communication_style);
    if (compatibleStyles.includes(mentorMetadata.communicationStyle)) {
      explanations.push(`Compatible ${mentorMetadata.communicationStyle} communication style`);
    }

    return explanations.length > 0 
      ? explanations.join('. ') 
      : `Good overall compatibility with ${Math.round(similarityScore * 100)}% similarity score`;
  }

  /**
   * Calculate archetype alignment score
   */
  private calculateArchetypeAlignment(userArchetype: string, mentorArchetype: string): number {
    if (userArchetype === mentorArchetype) {
      return 1.0;
    }

    // Cross-archetype compatibility matrix
    const compatibility: { [key: string]: { [key: string]: number } } = {
      investor: { developer: 0.7, social_user: 0.5 },
      developer: { investor: 0.7, social_user: 0.8 },
      social_user: { investor: 0.5, developer: 0.8 },
    };

    return compatibility[userArchetype]?.[mentorArchetype] || 0.3;
  }

  /**
   * Generate learning path suggestion
   */
  private generateLearningPathSuggestion(
    profile: CryptoNewcomerProfile,
    mentorMetadata: CryptoMentorMetadata
  ): string {
    const archetype = profile.archetype_classification.primary_archetype;
    const level = profile.crypto_interests.knowledge_level;

    const suggestions: { [key: string]: { [key: string]: string } } = {
      investor: {
        beginner: `Start with ${mentorMetadata.fullName}'s guidance on crypto fundamentals, then progress to DeFi basics and portfolio management strategies`,
        intermediate: `Focus on advanced DeFi strategies, risk management techniques, and market analysis with ${mentorMetadata.fullName}`,
        advanced: `Explore yield optimization, protocol analysis, and institutional investment strategies guided by ${mentorMetadata.fullName}`,
      },
      developer: {
        beginner: `Begin with blockchain fundamentals and Solidity basics, then build your first smart contracts with ${mentorMetadata.fullName}`,
        intermediate: `Master smart contract security, testing frameworks, and DeFi protocol development with ${mentorMetadata.fullName}`,
        advanced: `Focus on protocol architecture, MEV strategies, and gas optimization techniques guided by ${mentorMetadata.fullName}`,
      },
      social_user: {
        beginner: `Learn crypto culture, DAO fundamentals, and community engagement strategies with ${mentorMetadata.fullName}`,
        intermediate: `Develop expertise in governance design, tokenomics, and community management with ${mentorMetadata.fullName}`,
        advanced: `Master DAO operations, social token strategies, and ecosystem building guided by ${mentorMetadata.fullName}`,
      },
    };

    return suggestions[archetype]?.[level] || 
      `Collaborate with ${mentorMetadata.fullName} to develop a customized learning path based on your ${archetype} interests and ${level} knowledge level`;
  }
}

// Export singleton instance
export const cryptoHybridSearch = new CryptoHybridSearch();