import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getModel } from '@/lib/openrouter/config';
import { logger } from '@/lib/logger/index';
import { CryptoNewcomerProfileGenerationSchema } from '@/lib/types/interview';
import { getEmbedding } from '@/lib/embeddings';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, responses, archetypeClassification, walletAddress } = body;

    logger.info('Generating profile', { sessionId, responseCount: responses?.length });

    if (!responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'No interview responses provided' },
        { status: 400 }
      );
    }

    // Build a comprehensive prompt from all responses
    const conversationSummary = responses
      .map((r: any, i: number) => `Q${i + 1}: ${r.question}\nA: ${r.response}`)
      .join('\n\n');

    const profilePrompt = `Based on this crypto mentorship interview, generate a comprehensive user profile.

Interview Responses:
${conversationSummary}

Archetype Analysis:
Primary: ${archetypeClassification.primary_archetype}
Confidence: Investor ${(archetypeClassification.confidence_scores.investor * 100).toFixed(0)}%, Developer ${(archetypeClassification.confidence_scores.developer * 100).toFixed(0)}%, Social ${(archetypeClassification.confidence_scores.social_user * 100).toFixed(0)}%

Generate a detailed profile including:
- Personal info (use generic name if not provided, detect timezone from context)
- Archetype classification with confidence scores
- Crypto interests and goals
- Current background and experience
- Learning preferences
- Mentor requirements based on their expressed needs
- Logistics and availability

Make reasonable inferences where information is not explicitly stated, based on the archetype and responses.

Please respond with a valid JSON object that matches this structure:
{
  "personal_info": {
    "name": "string (inferred or Anonymous User)",
    "timezone": "string (inferred from context)"
  },
  "archetype_classification": {
    "primary_archetype": "investor|developer|social_user",
    "confidence_scores": {
      "investor": 0.0-1.0,
      "developer": 0.0-1.0,
      "social_user": 0.0-1.0
    },
    "signals": ["list of strings"]
  },
  "crypto_interests": {
    "primary_goals": ["list of strings"],
    "specific_interests": ["list of strings"],
    "knowledge_level": "beginner|intermediate|advanced|expert",
    "entry_motivation": ["list of strings"],
    "risk_tolerance": "conservative|moderate|aggressive"
  },
  "current_background": {
    "role": "string",
    "industry": "string",
    "experience_level": "0-2|3-5|6-10|10+",
    "technical_proficiency": "non_technical|basic|intermediate|advanced",
    "previous_crypto_experience": "none|exploring|active|experienced",
    "blockchain_familiarity": ["list of strings"]
  },
  "learning_preferences": {
    "learning_style": ["hands_on|structured|informal|project_based|theoretical"],
    "communication_style": "direct|collaborative|supportive|challenging",
    "meeting_frequency": "daily|weekly|biweekly|monthly|as_needed",
    "format_preference": ["video|phone|text|async"],
    "time_commitment": "low|medium|high"
  },
  "mentor_requirements": {
    "desired_expertise": ["list of strings"],
    "archetype_preference": "investor|developer|social_user|any",
    "minimum_experience": "1_year|3_years|5_years|10_years|no_preference",
    "specific_skills": ["list of strings"],
    "language_preferences": ["list of strings"]
  },
  "logistics": {
    "availability": {
      "days": ["monday|tuesday|wednesday|thursday|friday|saturday|sunday"],
      "times": ["morning|afternoon|evening|night"],
      "timezone": "string"
    },
    "commitment_level": "casual|moderate|intensive",
    "duration_expectation": "1_month|3_months|6_months|1_year|ongoing"
  },
  "search_keywords": ["list of strings"]
}`;

    const model = getModel('jsonGeneration');
    
    const { text: generatedJSON } = await generateText({
      model,
      system: 'You are a profile generation specialist. Create comprehensive, accurate profiles from interview data. Make reasonable inferences for missing data based on context and archetype. Respond with valid JSON only.',
      prompt: profilePrompt,
      temperature: 0.3,
    });

    logger.debug('Generated JSON from AI:', { 
      sessionId, 
      jsonLength: generatedJSON.length, 
      jsonPreview: generatedJSON.substring(0, 500) 
    });

    // Parse the JSON response
    let generatedProfile;
    try {
      // Clean up any markdown formatting that might be around the JSON
      let cleanJSON = generatedJSON.trim();
      if (cleanJSON.startsWith('```json')) {
        cleanJSON = cleanJSON.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJSON.startsWith('```')) {
        cleanJSON = cleanJSON.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      generatedProfile = JSON.parse(cleanJSON);
    } catch (parseError) {
      logger.error('Failed to parse generated profile JSON:', { 
        parseError: parseError.message, 
        generatedJSON: generatedJSON.substring(0, 1000),
        sessionId 
      });
      throw new Error('Invalid JSON generated by AI model');
    }

    // Validate the parsed profile against our schema
    const validatedProfile = CryptoNewcomerProfileGenerationSchema.parse(generatedProfile);

    // Add metadata and optional fields
    const profile = {
      ...validatedProfile,
      id: uuidv4(),
      created_at: new Date(),
      wallet_address: walletAddress,
      profile_type: 'newcomer' as const,
      personal_info: {
        ...validatedProfile.personal_info,
        email: undefined, // Optional field
        preferred_name: undefined, // Optional field
      },
      archetype_classification: {
        ...validatedProfile.archetype_classification,
        ...archetypeClassification,
      },
    };

    // Generate embedding for vector search
    const embeddingText = generateEmbeddingText(profile);
    const embedding = await getEmbedding(embeddingText);
    
    profile.vector_embedding = embedding;

    // Generate search keywords
    profile.search_keywords = generateSearchKeywords(profile);

    logger.info('Profile generated successfully', { 
      profileId: profile.id,
      archetype: profile.archetype_classification.primary_archetype 
    });

    return NextResponse.json({
      success: true,
      profile,
      embeddingGenerated: true,
    });
  } catch (error) {
    logger.error('Profile generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate profile' },
      { status: 500 }
    );
  }
}

function generateEmbeddingText(profile: any): string {
  const parts = [
    `Crypto ${profile.archetype_classification.primary_archetype}`,
    `Goals: ${profile.crypto_interests.primary_goals.join(', ')}`,
    `Interests: ${profile.crypto_interests.specific_interests.join(', ')}`,
    `Knowledge: ${profile.crypto_interests.knowledge_level}`,
    `Background: ${profile.current_background.role} in ${profile.current_background.industry}`,
    `Experience: ${profile.current_background.previous_crypto_experience}`,
    `Learning style: ${profile.learning_preferences.learning_style.join(', ')}`,
    `Seeking mentor in: ${profile.mentor_requirements.desired_expertise.join(', ')}`,
    `Commitment: ${profile.logistics.commitment_level}`,
  ];

  return parts.join(' | ');
}

function generateSearchKeywords(profile: any): string[] {
  const keywords = new Set<string>();

  // Add archetype
  keywords.add(profile.archetype_classification.primary_archetype);

  // Add interests
  profile.crypto_interests.primary_goals.forEach((goal: string) => 
    keywords.add(goal.toLowerCase())
  );
  profile.crypto_interests.specific_interests.forEach((interest: string) => 
    keywords.add(interest.toLowerCase())
  );

  // Add expertise requirements
  profile.mentor_requirements.desired_expertise.forEach((expertise: string) => 
    keywords.add(expertise.toLowerCase())
  );

  // Add blockchain familiarity
  if (profile.current_background.blockchain_familiarity) {
    profile.current_background.blockchain_familiarity.forEach((blockchain: string) => 
      keywords.add(blockchain.toLowerCase())
    );
  }

  // Add knowledge level
  keywords.add(profile.crypto_interests.knowledge_level);

  // Add learning preferences
  profile.learning_preferences.learning_style.forEach((style: string) => 
    keywords.add(style.toLowerCase())
  );

  return Array.from(keywords);
}