import { CryptoNewcomerProfile } from '@/lib/types/interview';
import { CryptoMentorMetadata } from './index-manager';
import { CryptoMatchResult } from './hybrid-search';
import { logger } from '@/lib/logger/index';

export interface CryptoMatchScore {
  overall_score: number;
  component_scores: {
    archetype_alignment: number;
    knowledge_gap_appropriateness: number;
    learning_style_compatibility: number;
    crypto_community_overlap: number;
    availability_match: number;
    reputation_factor: number;
  };
  explanation: string;
  learning_path_suggestion: string;
  risk_assessment: 'low' | 'medium' | 'high';
  confidence_level: number;
}

export class CryptoScoringEngine {
  
  /**
   * Calculate comprehensive crypto match score
   */
  calculateCryptoMatchScore(
    newcomer: CryptoNewcomerProfile,
    mentor: CryptoMentorMetadata,
    vectorSimilarity: number
  ): CryptoMatchScore {
    try {
      const scores = {
        archetype_alignment: this.calculateArchetypeScore(newcomer, mentor),
        knowledge_gap_appropriateness: this.calculateKnowledgeGapScore(newcomer, mentor),
        learning_style_compatibility: this.calculateLearningStyleScore(newcomer, mentor),
        crypto_community_overlap: this.calculateCommunityScore(newcomer, mentor),
        availability_match: this.calculateAvailabilityScore(newcomer, mentor),
        reputation_factor: this.calculateReputationScore(mentor),
      };

      // Crypto-specific weights
      const weights = {
        archetype_alignment: 0.25,        // High importance for crypto specialization
        knowledge_gap_appropriateness: 0.20, // Critical for effective learning
        learning_style_compatibility: 0.15,  // Important for communication
        crypto_community_overlap: 0.15,      // Crypto-specific networking
        availability_match: 0.10,            // Logistics matter
        reputation_factor: 0.15,             // Trust is crucial in crypto
      };

      // Base score from vector similarity
      const baseScore = vectorSimilarity * 0.6;

      // Weighted component score
      const componentScore = Object.entries(scores)
        .reduce((total, [key, score]) => total + (score * weights[key as keyof typeof weights]), 0) * 0.4;

      const overall_score = Math.min(baseScore + componentScore, 1.0);
      
      const explanation = this.generateCryptoMatchExplanation(scores, newcomer, mentor);
      const learning_path_suggestion = this.generateCryptoLearningPath(
        newcomer.archetype_classification.primary_archetype,
        newcomer.crypto_interests.knowledge_level,
        mentor
      );

      return {
        overall_score,
        component_scores: scores,
        explanation,
        learning_path_suggestion,
        risk_assessment: this.assessMentorshipRisk(newcomer, mentor, overall_score),
        confidence_level: this.calculateConfidenceLevel(scores, vectorSimilarity),
      };

    } catch (error) {
      logger.error('Failed to calculate crypto match score:', error);
      
      // Return basic fallback score
      return {
        overall_score: vectorSimilarity * 0.5,
        component_scores: {
          archetype_alignment: 0,
          knowledge_gap_appropriateness: 0,
          learning_style_compatibility: 0,
          crypto_community_overlap: 0,
          availability_match: 0,
          reputation_factor: 0,
        },
        explanation: 'Basic compatibility based on profile similarity',
        learning_path_suggestion: 'Collaborate to develop a customized learning approach',
        risk_assessment: 'medium',
        confidence_level: 0.3,
      };
    }
  }

  /**
   * Calculate archetype alignment with crypto-specific considerations
   */
  private calculateArchetypeScore(newcomer: CryptoNewcomerProfile, mentor: CryptoMentorMetadata): number {
    const newcomerArchetype = newcomer.archetype_classification.primary_archetype;
    const mentorArchetype = mentor.primaryArchetype;

    // Perfect match
    if (newcomerArchetype === mentorArchetype) {
      return 1.0;
    }

    // Crypto-specific cross-archetype synergies
    const cryptoSynergies: { [key: string]: { [key: string]: number } } = {
      investor: { 
        developer: 0.8,    // Investors benefit from technical understanding
        social_user: 0.6   // Social aspects help with deal flow
      },
      developer: { 
        investor: 0.7,     // Understanding economics helps developers
        social_user: 0.9   // Community is crucial for dev success
      },
      social_user: { 
        investor: 0.5,     // Some financial literacy helpful
        developer: 0.8     // Technical understanding enhances community work
      },
    };

    const synergyScore = cryptoSynergies[newcomerArchetype]?.[mentorArchetype] || 0.3;

    // Boost score if mentor has secondary archetype indicators
    const mentorSpecializations = mentor.specializations.map(s => s.toLowerCase());
    const newcomerInterests = newcomer.crypto_interests.specific_interests.map(s => s.toLowerCase());
    
    const crossArchetypeBonus = this.calculateCrossArchetypeBonus(
      mentorSpecializations, 
      newcomerInterests, 
      newcomerArchetype
    );

    return Math.min(synergyScore + crossArchetypeBonus, 1.0);
  }

  /**
   * Calculate knowledge gap appropriateness
   */
  private calculateKnowledgeGapScore(newcomer: CryptoNewcomerProfile, mentor: CryptoMentorMetadata): number {
    const newcomerLevel = newcomer.crypto_interests.knowledge_level;
    const mentorPreferred = mentor.preferredMenteeLevel;
    const mentorExperience = mentor.yearsInCrypto;

    // Direct level match
    if (mentorPreferred.includes(newcomerLevel)) {
      return 1.0;
    }

    // Experience-based appropriateness
    const experienceGapScore = this.calculateExperienceGapScore(newcomerLevel, mentorExperience);
    
    // Previous crypto experience consideration
    const previousExp = newcomer.current_background.previous_crypto_experience;
    const experienceBonus = this.getExperienceBonus(previousExp, mentorPreferred);

    return Math.min(experienceGapScore + experienceBonus, 1.0);
  }

  /**
   * Calculate learning style compatibility with crypto context
   */
  private calculateLearningStyleScore(newcomer: CryptoNewcomerProfile, mentor: CryptoMentorMetadata): number {
    const newcomerStyle = newcomer.learning_preferences.communication_style;
    const mentorStyle = mentor.communicationStyle;

    // Direct style matching
    const styleCompatibility: { [key: string]: { [key: string]: number } } = {
      direct: { direct: 1.0, challenging: 0.9, collaborative: 0.6, supportive: 0.4 },
      collaborative: { collaborative: 1.0, supportive: 0.9, direct: 0.7, challenging: 0.5 },
      supportive: { supportive: 1.0, collaborative: 0.8, direct: 0.4, challenging: 0.3 },
      challenging: { challenging: 1.0, direct: 0.8, collaborative: 0.6, supportive: 0.3 },
    };

    const baseScore = styleCompatibility[newcomerStyle]?.[mentorStyle] || 0.5;

    // Crypto-specific learning style bonuses
    const cryptoLearningBonus = this.getCryptoLearningBonus(newcomer, mentor);

    return Math.min(baseScore + cryptoLearningBonus, 1.0);
  }

  /**
   * Calculate crypto community overlap
   */
  private calculateCommunityScore(newcomer: CryptoNewcomerProfile, mentor: CryptoMentorMetadata): number {
    // Blockchain ecosystem overlap
    const newcomerChains = newcomer.current_background.blockchain_familiarity || [];
    const mentorChains = mentor.blockchainExpertise;
    
    const chainOverlap = this.calculateArrayOverlap(newcomerChains, mentorChains);
    
    // Interest overlap in crypto areas
    const newcomerInterests = newcomer.crypto_interests.specific_interests;
    const mentorSpecializations = mentor.specializations;
    
    const interestOverlap = this.calculateArrayOverlap(newcomerInterests, mentorSpecializations);
    
    // Community size and engagement factor
    const communityFactor = Math.min(mentor.communityReputation / 10, 1.0);
    
    return (chainOverlap * 0.3 + interestOverlap * 0.5 + communityFactor * 0.2);
  }

  /**
   * Calculate availability match
   */
  private calculateAvailabilityScore(newcomer: CryptoNewcomerProfile, mentor: CryptoMentorMetadata): number {
    // Timezone compatibility
    const newcomerTz = newcomer.logistics.availability.timezone;
    const mentorTz = mentor.timezone;
    const timezoneScore = this.calculateTimezoneCompatibility(newcomerTz, mentorTz);

    // Day overlap
    const newcomerDays = newcomer.logistics.availability.days;
    const mentorDays = mentor.availableDays;
    const dayOverlap = this.calculateArrayOverlap(newcomerDays, mentorDays);

    // Commitment level matching
    const newcomerCommitment = newcomer.logistics.commitment_level;
    const mentorAvailability = mentor.currentMentees < mentor.maxMentees ? 1.0 : 0.0;

    // Response time preference
    const responseTimeScore = this.calculateResponseTimeScore(
      newcomer.learning_preferences.time_commitment,
      mentor.responseTime
    );

    return (timezoneScore * 0.3 + dayOverlap * 0.3 + mentorAvailability * 0.2 + responseTimeScore * 0.2);
  }

  /**
   * Calculate reputation score
   */
  private calculateReputationScore(mentor: CryptoMentorMetadata): number {
    const reputationScore = mentor.communityReputation / 10; // 0-1 scale
    const successScore = Math.min(mentor.successfulMentees / 50, 1.0); // Cap at 50 for score calculation
    const completionScore = mentor.completionRate;

    return (reputationScore * 0.4 + successScore * 0.3 + completionScore * 0.3);
  }

  // Helper methods
  private calculateCrossArchetypeBonus(mentorSpecs: string[], newcomerInterests: string[], newcomerArchetype: string): number {
    // Look for cross-archetype indicators
    const crossIndicators: { [key: string]: string[] } = {
      investor: ['trading', 'defi', 'yield', 'portfolio', 'analysis'],
      developer: ['smart contracts', 'solidity', 'dapp', 'protocol', 'security'],
      social_user: ['dao', 'community', 'governance', 'nft', 'social'],
    };

    let bonus = 0;
    for (const [archetype, indicators] of Object.entries(crossIndicators)) {
      if (archetype !== newcomerArchetype) {
        const hasIndicator = indicators.some(indicator =>
          mentorSpecs.some(spec => spec.includes(indicator)) &&
          newcomerInterests.some(interest => interest.includes(indicator))
        );
        if (hasIndicator) bonus += 0.1;
      }
    }

    return Math.min(bonus, 0.3);
  }

  private calculateExperienceGapScore(newcomerLevel: string, mentorYears: number): number {
    const levelRequirements = {
      beginner: { min: 2, max: 10 },
      intermediate: { min: 3, max: 15 },
      advanced: { min: 5, max: 20 },
      expert: { min: 8, max: 25 },
    };

    const req = levelRequirements[newcomerLevel as keyof typeof levelRequirements];
    if (!req) return 0.5;

    if (mentorYears >= req.min && mentorYears <= req.max) return 1.0;
    if (mentorYears < req.min) return Math.max(0.3, mentorYears / req.min);
    return Math.max(0.7, req.max / mentorYears);
  }

  private getExperienceBonus(previousExp: string, mentorPreferred: string[]): number {
    const experienceMapping = {
      none: 'beginner',
      exploring: 'beginner',
      active: 'intermediate',
      experienced: 'advanced',
    };

    const mappedLevel = experienceMapping[previousExp as keyof typeof experienceMapping];
    return mentorPreferred.includes(mappedLevel) ? 0.2 : 0;
  }

  private getCryptoLearningBonus(newcomer: CryptoNewcomerProfile, mentor: CryptoMentorMetadata): number {
    let bonus = 0;

    // Hands-on learning with experienced developer
    if (newcomer.learning_preferences.learning_style.includes('hands_on') && 
        mentor.primaryArchetype === 'developer') {
      bonus += 0.1;
    }

    // Structured learning with systematic mentors
    if (newcomer.learning_preferences.learning_style.includes('structured') && 
        mentor.teachingStyle === 'directive') {
      bonus += 0.1;
    }

    // Social learning with community builders
    if (newcomer.learning_preferences.learning_style.includes('collaborative') && 
        mentor.primaryArchetype === 'social_user') {
      bonus += 0.1;
    }

    return Math.min(bonus, 0.2);
  }

  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 || arr2.length === 0) return 0;

    const set1 = new Set(arr1.map(s => s.toLowerCase()));
    const set2 = new Set(arr2.map(s => s.toLowerCase()));
    
    const intersection = Array.from(set1).filter(x => set2.has(x));
    return intersection.length / Math.max(set1.size, set2.size);
  }

  private calculateTimezoneCompatibility(tz1: string, tz2: string): number {
    if (tz1 === tz2) return 1.0;

    // Simplified timezone regions
    const regions: { [key: string]: string } = {
      'America/New_York': 'US_East',
      'America/Chicago': 'US_Central',
      'America/Los_Angeles': 'US_West',
      'Europe/London': 'Europe',
      'Asia/Singapore': 'Asia',
      'Asia/Seoul': 'Asia',
    };

    const region1 = regions[tz1] || 'Other';
    const region2 = regions[tz2] || 'Other';

    if (region1 === region2) return 0.8;
    
    // Some regions work better together
    const compatibility: { [key: string]: { [key: string]: number } } = {
      'US_East': { 'Europe': 0.6, 'US_Central': 0.9, 'US_West': 0.7 },
      'US_West': { 'Asia': 0.6, 'US_Central': 0.9, 'US_East': 0.7 },
      'Europe': { 'US_East': 0.6, 'Asia': 0.4 },
      'Asia': { 'US_West': 0.6, 'Europe': 0.4 },
    };

    return compatibility[region1]?.[region2] || 0.3;
  }

  private calculateResponseTimeScore(commitment: string, responseTime: string): number {
    const preferences: { [key: string]: string[] } = {
      low: ['next_day', 'weekly'],
      medium: ['same_day', 'next_day'],
      high: ['immediate', 'same_day'],
    };

    const preferred = preferences[commitment] || ['same_day'];
    return preferred.includes(responseTime) ? 1.0 : 0.5;
  }

  private generateCryptoMatchExplanation(
    scores: any,
    newcomer: CryptoNewcomerProfile,
    mentor: CryptoMentorMetadata
  ): string {
    const explanations = [];

    if (scores.archetype_alignment >= 0.8) {
      explanations.push(`Excellent ${newcomer.archetype_classification.primary_archetype}-${mentor.primaryArchetype} archetype synergy`);
    }

    if (scores.knowledge_gap_appropriateness >= 0.8) {
      explanations.push(`Perfect experience level match for ${newcomer.crypto_interests.knowledge_level} learners`);
    }

    if (scores.crypto_community_overlap >= 0.7) {
      explanations.push(`Strong alignment in crypto interests and blockchain ecosystems`);
    }

    if (scores.reputation_factor >= 0.8) {
      explanations.push(`Highly trusted mentor with proven track record (${mentor.communityReputation}/10 rating)`);
    }

    if (explanations.length === 0) {
      explanations.push(`Good overall compatibility in the crypto mentorship context`);
    }

    return explanations.join('. ');
  }

  private generateCryptoLearningPath(
    archetype: string,
    knowledgeLevel: string,
    mentor: CryptoMentorMetadata
  ): string {
    const paths: { [key: string]: { [key: string]: string } } = {
      investor: {
        beginner: `Start with crypto market fundamentals and basic DeFi concepts, then explore ${mentor.specializations.slice(0, 2).join(' and ')} with ${mentor.fullName}`,
        intermediate: `Focus on advanced portfolio strategies, risk management, and dive deep into ${mentor.specializations[0]} expertise`,
        advanced: `Master institutional-grade strategies, protocol analysis, and leverage ${mentor.fullName}'s ${mentor.yearsInCrypto} years of market experience`,
      },
      developer: {
        beginner: `Build foundation with blockchain basics and Solidity, then progress to ${mentor.specializations.slice(0, 2).join(' and ')} development`,
        intermediate: `Advanced smart contract patterns, security best practices, and hands-on ${mentor.specializations[0]} implementation`,
        advanced: `Protocol architecture, gas optimization, and cutting-edge development in ${mentor.specializations[0]}`,
      },
      social_user: {
        beginner: `Understand crypto culture and community dynamics, then explore ${mentor.specializations.slice(0, 2).join(' and ')} strategies`,
        intermediate: `Master governance mechanisms, tokenomics design, and leverage ${mentor.fullName}'s community expertise`,
        advanced: `Lead ecosystem building, design social token economies, and develop ${mentor.specializations[0]} leadership skills`,
      },
    };

    return paths[archetype]?.[knowledgeLevel] || 
      `Collaborate with ${mentor.fullName} to create a personalized learning journey in ${mentor.specializations[0]}`;
  }

  private assessMentorshipRisk(
    newcomer: CryptoNewcomerProfile,
    mentor: CryptoMentorMetadata,
    overallScore: number
  ): 'low' | 'medium' | 'high' {
    let riskFactors = 0;

    // High risk factors
    if (mentor.communityReputation < 7) riskFactors += 2;
    if (mentor.completionRate < 0.7) riskFactors += 2;
    if (overallScore < 0.5) riskFactors += 1;
    
    // Medium risk factors
    if (mentor.yearsInCrypto < 3) riskFactors += 1;
    if (mentor.currentMentees >= mentor.maxMentees * 0.9) riskFactors += 1;

    if (riskFactors >= 3) return 'high';
    if (riskFactors >= 1) return 'medium';
    return 'low';
  }

  private calculateConfidenceLevel(scores: any, vectorSimilarity: number): number {
    const avgComponentScore = Object.values(scores).reduce((sum: number, score) => sum + (score as number), 0) / Object.keys(scores).length;
    const confidenceScore = (avgComponentScore + vectorSimilarity) / 2;
    return Math.min(Math.max(confidenceScore, 0.1), 0.95); // Keep between 10% and 95%
  }
}

// Export singleton instance
export const cryptoScoringEngine = new CryptoScoringEngine();