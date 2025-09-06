import { 
  pineconeIndexManager, 
  CryptoMentorMetadata, 
  ARCHETYPE_NAMESPACES,
  ArchetypeNamespace 
} from './index-manager';
import { CryptoMentorProfile } from '@/lib/types/interview';
import { getEmbedding, getBatchEmbeddings } from '@/lib/embeddings';
import { logger } from '@/lib/logger/index';

export interface MentorVector {
  id: string;
  values: number[];
  metadata: CryptoMentorMetadata;
}

export class MentorVectorizer {
  private indexName: string;

  constructor(indexName = 'crypto-mentors') {
    this.indexName = indexName;
  }

  /**
   * Convert crypto mentor profile to searchable text for embedding
   */
  buildMentorEmbeddingText(mentor: CryptoMentorProfile): string {
    const textParts = [
      // Bio and personal context
      mentor.personal_info.bio,
      
      // Archetype and primary focus
      `Crypto ${mentor.crypto_expertise.primary_archetype} mentor`,
      
      // Specializations and expertise
      `Specializes in: ${mentor.crypto_expertise.specializations.join(', ')}`,
      
      // Experience and background
      `${mentor.crypto_expertise.years_in_crypto} years of crypto experience`,
      
      // Notable achievements
      mentor.crypto_expertise.notable_achievements.length > 0 
        ? `Achievements: ${mentor.crypto_expertise.notable_achievements.join(', ')}`
        : '',
      
      // Current projects
      mentor.crypto_expertise.current_projects.length > 0
        ? `Current projects: ${mentor.crypto_expertise.current_projects.join(', ')}`
        : '',
      
      // Blockchain expertise
      mentor.crypto_expertise.blockchain_expertise.length > 0
        ? `Blockchain expertise: ${mentor.crypto_expertise.blockchain_expertise.join(', ')}`
        : '',
      
      // Teaching approach
      `Teaching style: ${mentor.mentoring_approach.teaching_style}`,
      `Communication: ${mentor.mentoring_approach.communication_style}`,
      
      // Teaching focus areas
      mentor.mentoring_approach.teaching_focus.length > 0
        ? `Teaches: ${mentor.mentoring_approach.teaching_focus.join(', ')}`
        : '',
      
      // Mentoring strengths
      mentor.mentoring_approach.strengths.length > 0
        ? `Strengths: ${mentor.mentoring_approach.strengths.join(', ')}`
        : '',
      
      // Preferred mentee levels
      `Works with: ${mentor.mentoring_approach.preferred_mentee_level.join(', ')} level mentees`,
      
      // Reputation and success metrics
      `Community reputation: ${mentor.metrics.community_reputation}/10`,
      `Successfully mentored ${mentor.metrics.successful_mentees} people`,
      
      // Availability context
      `Available ${mentor.availability.days.length} days per week`,
      `Timezone: ${mentor.availability.timezone}`,
      `Response time: ${mentor.availability.response_time}`,
      
    ].filter(Boolean); // Remove empty strings
    
    return textParts.join('. ');
  }

  /**
   * Extract structured metadata for Pinecone filtering
   */
  extractMentorMetadata(mentor: CryptoMentorProfile): CryptoMentorMetadata {
    return {
      // Personal info
      fullName: mentor.personal_info.fullName,
      farcasterUsername: mentor.personal_info.farcasterUsername,
      fid: mentor.personal_info.fid,
      timezone: mentor.personal_info.timezone,
      bio: mentor.personal_info.bio,
      
      // Crypto expertise
      primaryArchetype: mentor.crypto_expertise.primary_archetype,
      specializations: mentor.crypto_expertise.specializations,
      yearsInCrypto: mentor.crypto_expertise.years_in_crypto,
      notableAchievements: mentor.crypto_expertise.notable_achievements,
      currentProjects: mentor.crypto_expertise.current_projects,
      blockchainExpertise: mentor.crypto_expertise.blockchain_expertise,
      
      // Mentoring approach
      teachingStyle: mentor.mentoring_approach.teaching_style,
      teachingFocus: mentor.mentoring_approach.teaching_focus,
      communicationStyle: mentor.mentoring_approach.communication_style,
      preferredMenteeLevel: mentor.mentoring_approach.preferred_mentee_level,
      
      // Availability
      isAvailable: mentor.availability.is_available,
      availableDays: mentor.availability.days,
      availableTimes: mentor.availability.times,
      maxMentees: mentor.availability.max_mentees,
      currentMentees: mentor.availability.current_mentees,
      responseTime: mentor.availability.response_time,
      
      // Metrics
      successfulMentees: mentor.metrics.successful_mentees,
      communityReputation: mentor.metrics.community_reputation,
      completionRate: mentor.metrics.completion_rate,
      
      // Search metadata
      searchKeywords: mentor.search_keywords,
      profileType: 'mentor' as const,
      createdAt: mentor.created_at.toISOString(),
    };
  }

  /**
   * Convert a single mentor profile to vector representation
   */
  async vectorizeMentor(mentor: CryptoMentorProfile): Promise<MentorVector> {
    try {
      logger.debug('Vectorizing mentor profile', { 
        mentorId: mentor.id,
        archetype: mentor.crypto_expertise.primary_archetype 
      });

      const embeddingText = this.buildMentorEmbeddingText(mentor);
      const embedding = await getEmbedding(embeddingText);
      const metadata = this.extractMentorMetadata(mentor);

      return {
        id: `mentor_${mentor.id}`,
        values: embedding,
        metadata,
      };
    } catch (error) {
      logger.error('Failed to vectorize mentor:', { mentorId: mentor.id, error });
      throw error;
    }
  }

  /**
   * Batch vectorize multiple mentor profiles
   */
  async vectorizeMentorBatch(mentors: CryptoMentorProfile[]): Promise<MentorVector[]> {
    try {
      logger.info('Batch vectorizing mentors', { count: mentors.length });

      // Generate embedding texts for all mentors
      const embeddingTexts = mentors.map(mentor => this.buildMentorEmbeddingText(mentor));
      
      // Get embeddings in batch (more efficient)
      const embeddings = await getBatchEmbeddings(embeddingTexts);
      
      // Create vectors with metadata
      const vectors: MentorVector[] = mentors.map((mentor, index) => ({
        id: `mentor_${mentor.id}`,
        values: embeddings[index],
        metadata: this.extractMentorMetadata(mentor),
      }));

      logger.info('Batch vectorization completed', { 
        vectorCount: vectors.length,
        avgEmbeddingLength: embeddings[0]?.length || 0 
      });

      return vectors;
    } catch (error) {
      logger.error('Failed to batch vectorize mentors:', error);
      throw error;
    }
  }

  /**
   * Upload single mentor to Pinecone
   */
  async uploadMentor(mentor: CryptoMentorProfile): Promise<void> {
    try {
      const vector = await this.vectorizeMentor(mentor);
      const index = await pineconeIndexManager.getIndex(this.indexName);
      
      // Determine namespace based on archetype
      const namespace = ARCHETYPE_NAMESPACES[mentor.crypto_expertise.primary_archetype];
      
      await index.namespace(namespace).upsert([vector]);
      
      // Also add to "all" namespace for cross-archetype searches
      await index.namespace(ARCHETYPE_NAMESPACES.all).upsert([vector]);
      
      logger.info('Mentor uploaded to Pinecone', {
        mentorId: mentor.id,
        namespace,
        vectorId: vector.id
      });
    } catch (error) {
      logger.error('Failed to upload mentor:', { mentorId: mentor.id, error });
      throw error;
    }
  }

  /**
   * Bulk upload mentors to Pinecone with batch processing
   */
  async bulkUploadMentors(
    mentors: CryptoMentorProfile[], 
    batchSize = 100
  ): Promise<void> {
    try {
      logger.info('Starting bulk mentor upload', { 
        totalMentors: mentors.length, 
        batchSize 
      });

      const vectors = await this.vectorizeMentorBatch(mentors);
      const index = await pineconeIndexManager.getIndex(this.indexName);

      // Group vectors by archetype for namespace organization
      const vectorsByArchetype = new Map<ArchetypeNamespace, MentorVector[]>();
      
      for (const vector of vectors) {
        const archetype = vector.metadata.primaryArchetype as ArchetypeNamespace;
        if (!vectorsByArchetype.has(archetype)) {
          vectorsByArchetype.set(archetype, []);
        }
        vectorsByArchetype.get(archetype)!.push(vector);
      }

      // Upload to archetype-specific namespaces
      for (const [archetype, archetypeVectors] of vectorsByArchetype) {
        const namespace = ARCHETYPE_NAMESPACES[archetype];
        
        for (let i = 0; i < archetypeVectors.length; i += batchSize) {
          const batch = archetypeVectors.slice(i, i + batchSize);
          
          await index.namespace(namespace).upsert(batch);
          
          logger.info(`Uploaded batch to ${namespace}`, {
            batchNumber: Math.floor(i / batchSize) + 1,
            batchSize: batch.length,
            archetype
          });
          
          // Rate limiting to avoid API limits
          if (i + batchSize < archetypeVectors.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Upload all vectors to the "all" namespace for cross-archetype search
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        
        await index.namespace(ARCHETYPE_NAMESPACES.all).upsert(batch);
        
        logger.info(`Uploaded batch to all namespace`, {
          batchNumber: Math.floor(i / batchSize) + 1,
          batchSize: batch.length
        });
        
        // Rate limiting
        if (i + batchSize < vectors.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info('Bulk upload completed successfully', {
        totalVectors: vectors.length,
        archetypesProcessed: vectorsByArchetype.size
      });

    } catch (error) {
      logger.error('Bulk upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete mentor from Pinecone
   */
  async deleteMentor(mentorId: string, archetype: ArchetypeNamespace): Promise<void> {
    try {
      const index = await pineconeIndexManager.getIndex(this.indexName);
      const vectorId = `mentor_${mentorId}`;
      
      // Delete from archetype-specific namespace
      const namespace = ARCHETYPE_NAMESPACES[archetype];
      await index.namespace(namespace).deleteOne(vectorId);
      
      // Delete from "all" namespace
      await index.namespace(ARCHETYPE_NAMESPACES.all).deleteOne(vectorId);
      
      logger.info('Mentor deleted from Pinecone', {
        mentorId,
        vectorId,
        archetype
      });
    } catch (error) {
      logger.error('Failed to delete mentor:', { mentorId, error });
      throw error;
    }
  }

  /**
   * Update mentor in Pinecone (delete and re-add with new data)
   */
  async updateMentor(mentor: CryptoMentorProfile): Promise<void> {
    try {
      // Delete existing entry if archetype might have changed
      await this.deleteMentor(mentor.id, mentor.crypto_expertise.primary_archetype);
      
      // Upload updated mentor
      await this.uploadMentor(mentor);
      
      logger.info('Mentor updated in Pinecone', { mentorId: mentor.id });
    } catch (error) {
      logger.error('Failed to update mentor:', { mentorId: mentor.id, error });
      throw error;
    }
  }
}

// Export singleton instance
export const mentorVectorizer = new MentorVectorizer();