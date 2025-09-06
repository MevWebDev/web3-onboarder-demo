import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { getModel } from '@/lib/openrouter/config';
import { logger } from '@/lib/logger/index';
import { CryptoNewcomerProfileSchema } from '@/lib/types/interview';
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

Make reasonable inferences where information is not explicitly stated, based on the archetype and responses.`;

    const model = getModel('jsonGeneration');
    
    const { object: generatedProfile } = await generateObject({
      model,
      schema: CryptoNewcomerProfileSchema,
      system: 'You are a profile generation specialist. Create comprehensive, accurate profiles from interview data. Make reasonable inferences for missing data based on context and archetype.',
      prompt: profilePrompt,
      temperature: 0.3, // Lower temperature for more consistent output
    });

    // Add metadata
    const profile = {
      ...generatedProfile,
      id: uuidv4(),
      created_at: new Date(),
      wallet_address: walletAddress,
      archetype_classification: {
        ...generatedProfile.archetype_classification,
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