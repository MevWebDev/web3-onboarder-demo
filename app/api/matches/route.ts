import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger/index';
import { fakeMentors } from '@/lib/data/fakeMentors';
import { CryptoNewcomerProfile, MatchResult } from '@/lib/types/interview';
import { cryptoHybridSearch } from '@/lib/pinecone/hybrid-search';
import { cryptoScoringEngine } from '@/lib/pinecone/crypto-scoring';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profile, preferences = {} } = body as { 
      profile: CryptoNewcomerProfile; 
      preferences?: any; 
    };

    logger.info('Finding mentor matches with Pinecone', { 
      profileId: profile.id,
      archetype: profile.archetype_classification.primary_archetype 
    });

    const startTime = Date.now();

    // Use Pinecone hybrid search for mentor matching
    const pineconeMatches = await findMentorMatchesWithPinecone(profile, preferences);
    
    // Fallback to in-memory matching if Pinecone fails
    const matches = pineconeMatches.length > 0 
      ? pineconeMatches 
      : await findMentorMatchesFallback(profile);

    const searchTime = Date.now() - startTime;

    logger.info('Mentor matches found', { 
      count: matches.length,
      searchTimeMs: searchTime,
      usedPinecone: pineconeMatches.length > 0
    });

    return NextResponse.json({
      success: true,
      matches: matches.slice(0, 5), // Return top 5 matches
      total_count: matches.length,
      search_time_ms: searchTime,
      search_method: pineconeMatches.length > 0 ? 'pinecone' : 'fallback',
    });
  } catch (error) {
    logger.error('Mentor matching error:', error);
    return NextResponse.json(
      { error: 'Failed to find mentor matches' },
      { status: 500 }
    );
  }
}

async function findMentorMatchesWithPinecone(
  profile: CryptoNewcomerProfile, 
  preferences: any
): Promise<MatchResult[]> {
  try {
    logger.info('Using Pinecone hybrid search for mentor matching');

    // Use the hybrid search system to find matches
    const searchResults = await cryptoHybridSearch.searchCryptoMentors(profile, {
      maxResults: 8,
      minScore: 0.3,
      includeMetadata: true,
      preferredArchetypes: preferences.preferredArchetypes,
      experienceRange: preferences.experienceRange,
      availabilityRequired: preferences.availabilityRequired !== false,
      responseTimePreference: preferences.responseTimePreference,
    });

    // Convert search results to MatchResult format
    const matches: MatchResult[] = [];

    for (const result of searchResults) {
      // Get enhanced scoring from the crypto scoring engine
      const scoringResult = await cryptoScoringEngine.calculateCryptoMatchScore(profile, result.metadata, result.score || 0);
      
      // Find matching fake mentor for full profile data (temporary until real DB)
      const fullMentor = fakeMentors.find(mentor => 
        mentor.personal_info.fullName === result.metadata.fullName
      );

      if (fullMentor) {
        matches.push({
          mentor: fullMentor,
          similarity_score: scoringResult.overall_score,
          archetype_alignment: result.archetypeAlignment,
          match_explanation: scoringResult.explanation,
          learning_path_suggestion: result.learningPathSuggestion || 
            generateLearningPathSuggestion(profile, fullMentor),
          search_strategy: result.searchStrategy,
          confidence_level: (scoringResult.confidence_level as unknown) as 'very_high' | 'high' | 'medium' | 'low' || 'medium',
          risk_assessment: scoringResult.risk_assessment,
          component_scores: scoringResult.component_scores,
        });
      }
    }

    logger.info('Pinecone search completed', {
      searchResults: searchResults.length,
      matches: matches.length
    });

    return matches;

  } catch (error) {
    logger.error('Pinecone search failed, falling back to in-memory:', error);
    return [];
  }
}

async function findMentorMatchesFallback(profile: CryptoNewcomerProfile): Promise<MatchResult[]> {
  // Filter available mentors
  const availableMentors = fakeMentors.filter(mentor => 
    mentor.availability.is_available && 
    mentor.availability.current_mentees < mentor.availability.max_mentees
  );

  // Calculate match scores for each mentor
  const matches: MatchResult[] = [];

  for (const mentor of availableMentors) {
    const matchScore = await calculateMatchScore(profile, mentor);
    
    if (matchScore.similarity_score > 0.3) { // Only include decent matches
      matches.push({
        mentor,
        similarity_score: matchScore.similarity_score,
        archetype_alignment: matchScore.archetype_alignment,
        match_explanation: matchScore.explanation,
        learning_path_suggestion: generateLearningPathSuggestion(profile, mentor),
      });
    }
  }

  // Sort by similarity score (descending)
  return matches.sort((a, b) => b.similarity_score - a.similarity_score);
}

async function calculateMatchScore(
  profile: CryptoNewcomerProfile,
  mentor: any
): Promise<{
  similarity_score: number;
  archetype_alignment: number;
  explanation: string;
}> {
  // Archetype alignment (40% weight)
  const archetypeAlignment = calculateArchetypeAlignment(profile, mentor);
  
  // Interest/expertise alignment (30% weight)  
  const interestAlignment = calculateInterestAlignment(profile, mentor);
  
  // Learning style compatibility (20% weight)
  const learningStyleAlignment = calculateLearningStyleAlignment(profile, mentor);
  
  // Availability/logistics (10% weight)
  const availabilityAlignment = calculateAvailabilityAlignment(profile, mentor);

  const overallScore = 
    archetypeAlignment * 0.4 +
    interestAlignment * 0.3 +
    learningStyleAlignment * 0.2 +
    availabilityAlignment * 0.1;

  const explanation = generateMatchExplanation(
    archetypeAlignment,
    interestAlignment,
    learningStyleAlignment,
    availabilityAlignment,
    profile,
    mentor
  );

  return {
    similarity_score: overallScore,
    archetype_alignment: archetypeAlignment,
    explanation,
  };
}

function calculateArchetypeAlignment(profile: CryptoNewcomerProfile, mentor: any): number {
  const profileArchetype = profile.archetype_classification.primary_archetype;
  const mentorArchetype = mentor.crypto_expertise.primary_archetype;
  
  if (profileArchetype === mentorArchetype) {
    return 1.0; // Perfect match
  }
  
  // Cross-archetype compatibility matrix
  const compatibility: { [key: string]: { [key: string]: number } } = {
    investor: { developer: 0.6, social_user: 0.4 },
    developer: { investor: 0.6, social_user: 0.7 },
    social_user: { investor: 0.4, developer: 0.7 },
  };
  
  return compatibility[profileArchetype]?.[mentorArchetype] || 0.3;
}

function calculateInterestAlignment(profile: CryptoNewcomerProfile, mentor: any): number {
  const profileInterests = new Set([
    ...profile.crypto_interests.primary_goals,
    ...profile.crypto_interests.specific_interests,
    ...profile.mentor_requirements.desired_expertise,
  ]);
  
  const mentorSpecializations = new Set(mentor.crypto_expertise.specializations);
  
  // Count overlapping interests
  const overlap = Array.from(profileInterests).filter(interest => 
    Array.from(mentorSpecializations).some(spec => 
      spec.toLowerCase().includes(interest.toLowerCase()) ||
      interest.toLowerCase().includes(spec.toLowerCase())
    )
  );
  
  return Math.min(overlap.length / Math.max(profileInterests.size, 1), 1.0);
}

function calculateLearningStyleAlignment(profile: CryptoNewcomerProfile, mentor: any): number {
  const profileStyle = profile.learning_preferences.communication_style;
  const mentorStyle = mentor.mentoring_approach.communication_style;
  
  // Style compatibility matrix
  const compatibility: { [key: string]: { [key: string]: number } } = {
    direct: { direct: 1.0, collaborative: 0.7, supportive: 0.5, challenging: 0.8 },
    collaborative: { direct: 0.7, collaborative: 1.0, supportive: 0.9, challenging: 0.6 },
    supportive: { direct: 0.5, collaborative: 0.9, supportive: 1.0, challenging: 0.4 },
    challenging: { direct: 0.8, collaborative: 0.6, supportive: 0.4, challenging: 1.0 },
  };
  
  return compatibility[profileStyle]?.[mentorStyle] || 0.5;
}

function calculateAvailabilityAlignment(profile: CryptoNewcomerProfile, mentor: any): number {
  // Simple timezone-based compatibility for now
  const profileTz = profile.logistics.availability.timezone;
  const mentorTz = mentor.availability.timezone;
  
  if (profileTz === mentorTz) {
    return 1.0;
  }
  
  // Basic geographic proximity (simplified)
  const regions: { [key: string]: string } = {
    'America/New_York': 'US',
    'America/Los_Angeles': 'US', 
    'America/Chicago': 'US',
    'Europe/London': 'EU',
    'Asia/Singapore': 'ASIA',
    'Asia/Seoul': 'ASIA',
  };
  
  const profileRegion = regions[profileTz] || 'OTHER';
  const mentorRegion = regions[mentorTz] || 'OTHER';
  
  return profileRegion === mentorRegion ? 0.8 : 0.4;
}

function generateMatchExplanation(
  archetypeAlignment: number,
  interestAlignment: number,
  learningStyleAlignment: number,
  availabilityAlignment: number,
  profile: CryptoNewcomerProfile,
  mentor: any
): string {
  const explanations = [];
  
  if (archetypeAlignment >= 0.8) {
    explanations.push(`Perfect archetype match - both ${profile.archetype_classification.primary_archetype}s`);
  } else if (archetypeAlignment >= 0.6) {
    explanations.push(`Good cross-archetype compatibility between ${profile.archetype_classification.primary_archetype} and ${mentor.crypto_expertise.primary_archetype}`);
  }
  
  if (interestAlignment >= 0.6) {
    explanations.push(`Strong overlap in areas like ${profile.mentor_requirements.desired_expertise.slice(0, 2).join(', ')}`);
  }
  
  if (learningStyleAlignment >= 0.8) {
    explanations.push(`Excellent communication style match`);
  }
  
  if (mentor.metrics.community_reputation >= 9.0) {
    explanations.push(`Highly rated mentor with ${mentor.metrics.successful_mentees}+ successful mentorships`);
  }
  
  return explanations.join('. ') || 'Good overall compatibility based on your preferences.';
}

function generateLearningPathSuggestion(profile: CryptoNewcomerProfile, mentor: any): string {
  const archetype = profile.archetype_classification.primary_archetype;
  const knowledgeLevel = profile.crypto_interests.knowledge_level;
  
  const paths: { [key: string]: { [key: string]: string } } = {
    investor: {
      beginner: 'Start with crypto fundamentals, basic DeFi concepts, then portfolio management',
      intermediate: 'Focus on advanced DeFi strategies, risk management, and market analysis',
      advanced: 'Explore yield optimization, protocol analysis, and institutional strategies',
    },
    developer: {
      beginner: 'Learn blockchain basics, Solidity fundamentals, then build simple smart contracts',
      intermediate: 'Master smart contract security, testing, and DeFi protocol development',
      advanced: 'Focus on protocol architecture, MEV strategies, and advanced optimization',
    },
    social_user: {
      beginner: 'Understand crypto culture, DAO basics, and community engagement strategies',
      intermediate: 'Learn governance design, tokenomics, and advanced community management',
      advanced: 'Master DAO operations, social token strategies, and ecosystem building',
    },
  };
  
  return paths[archetype]?.[knowledgeLevel] || 'Customized learning path based on your goals and interests';
}