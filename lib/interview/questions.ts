import { CryptoArchetype } from '@/lib/types/interview';

export interface QuestionTemplate {
  category: string;
  prompt: string;
  systemPrompt: string;
  required_fields: string[];
  archetype_signals: {
    investor: string[];
    developer: string[];
    social_user: string[];
  };
}

export const questionTemplates: QuestionTemplate[] = [
  {
    category: 'crypto_goals',
    prompt: `Welcome to the crypto space! I'm here to help match you with the perfect mentor. 
    
    Let's start with understanding your interests - what brings you to the crypto world? Are you more interested in trading and investments, building blockchain applications, or engaging with crypto communities and DAOs?`,
    
    systemPrompt: `You are a friendly crypto onboarding specialist. Extract information about:
    - Primary goals in crypto (investing, developing, community participation)
    - Specific areas of interest (DeFi, NFTs, DAOs, trading, smart contracts, etc.)
    - Entry motivation (financial opportunity, technology interest, community, ideology)
    - Initial knowledge level
    
    Keep the conversation natural and encouraging. If they mention specific interests, ask a brief follow-up to understand depth.`,
    
    required_fields: ['primary_goals', 'specific_interests', 'entry_motivation'],
    
    archetype_signals: {
      investor: ['trading', 'investment', 'portfolio', 'DeFi', 'yield', 'staking', 'ROI', 'market analysis'],
      developer: ['smart contracts', 'coding', 'building', 'solidity', 'dApps', 'protocol', 'technical', 'programming'],
      social_user: ['community', 'DAO', 'governance', 'NFTs', 'social', 'networking', 'culture', 'art'],
    },
  },
  
  {
    category: 'background_experience',
    prompt: `That's great! Now, tell me a bit about your background - what's your current role or profession, and have you had any previous experience with crypto or blockchain technology?`,
    
    systemPrompt: `Extract information about:
    - Current professional role and industry
    - Technical proficiency level
    - Previous crypto/blockchain experience
    - Relevant skills that might transfer to crypto
    - Familiarity with specific blockchains or protocols
    
    Identify transferable skills and experience that would influence mentor matching.`,
    
    required_fields: ['role', 'industry', 'technical_proficiency', 'previous_crypto_experience'],
    
    archetype_signals: {
      investor: ['finance', 'trading', 'analysis', 'investment', 'portfolio management', 'risk'],
      developer: ['engineering', 'programming', 'technical', 'software', 'IT', 'computer science'],
      social_user: ['marketing', 'community', 'content', 'social media', 'design', 'creative'],
    },
  },
  
  {
    category: 'learning_style',
    prompt: `How do you prefer to learn new things? Some people like hands-on experimentation, others prefer structured courses, and some learn best through community discussions. What works best for you?`,
    
    systemPrompt: `Extract information about:
    - Preferred learning style (hands-on, structured, informal, etc.)
    - Communication preferences
    - Time commitment they can make
    - Format preferences (video calls, text, async communication)
    - Whether they prefer individual or group learning
    
    This helps match them with mentors who teach in compatible styles.`,
    
    required_fields: ['learning_style', 'communication_style', 'time_commitment'],
    
    archetype_signals: {
      investor: ['analysis', 'research', 'data-driven', 'systematic', 'metrics'],
      developer: ['hands-on', 'documentation', 'coding', 'technical', 'problem-solving'],
      social_user: ['discussion', 'community', 'collaborative', 'networking', 'group learning'],
    },
  },
  
  {
    category: 'mentor_preferences',
    prompt: `What kind of expertise would be most valuable to you in a mentor? For example, someone who's a DeFi expert, a smart contract developer, a successful crypto trader, or a DAO community leader?`,
    
    systemPrompt: `Extract information about:
    - Desired mentor expertise areas
    - Preferred mentor archetype (investor, developer, social)
    - Specific skills they want to learn
    - Minimum experience level they expect
    - Any specific blockchain ecosystems they're interested in
    
    This directly influences mentor matching criteria.`,
    
    required_fields: ['desired_expertise', 'archetype_preference', 'specific_skills'],
    
    archetype_signals: {
      investor: ['trading strategies', 'portfolio', 'risk management', 'market analysis', 'DeFi protocols'],
      developer: ['smart contracts', 'security', 'architecture', 'testing', 'deployment', 'optimization'],
      social_user: ['community building', 'governance', 'content creation', 'networking', 'DAO management'],
    },
  },
  
  {
    category: 'logistics_commitment',
    prompt: `Finally, let's talk about the practical side - what's your availability for mentoring sessions, and how long are you hoping to work with a mentor? Are you looking for intensive daily guidance or more casual weekly check-ins?`,
    
    systemPrompt: `Extract information about:
    - Availability (days and times)
    - Timezone
    - Preferred meeting frequency
    - Commitment level (casual, moderate, intensive)
    - Expected duration of mentorship
    - Preferred communication format
    
    Ensure timezone is captured for matching with available mentors.`,
    
    required_fields: ['availability', 'commitment_level', 'duration_expectation', 'timezone'],
    
    archetype_signals: {
      investor: ['market hours', 'trading sessions', 'daily analysis'],
      developer: ['project-based', 'sprint', 'development cycles', 'debugging sessions'],
      social_user: ['community events', 'flexible', 'async', 'social hours'],
    },
  },
];

// Helper function to detect archetype signals in responses
export function detectArchetypeSignals(
  response: string,
  signals: { investor: string[]; developer: string[]; social_user: string[] }
): { investor: number; developer: number; social_user: number } {
  const responseLower = response.toLowerCase();
  
  const scores = {
    investor: 0,
    developer: 0,
    social_user: 0,
  };
  
  // Count signal matches for each archetype
  for (const signal of signals.investor) {
    if (responseLower.includes(signal.toLowerCase())) {
      scores.investor++;
    }
  }
  
  for (const signal of signals.developer) {
    if (responseLower.includes(signal.toLowerCase())) {
      scores.developer++;
    }
  }
  
  for (const signal of signals.social_user) {
    if (responseLower.includes(signal.toLowerCase())) {
      scores.social_user++;
    }
  }
  
  // Normalize scores
  const total = scores.investor + scores.developer + scores.social_user;
  if (total > 0) {
    scores.investor = scores.investor / total;
    scores.developer = scores.developer / total;
    scores.social_user = scores.social_user / total;
  }
  
  return scores;
}

// Get the next question based on current state
export function getNextQuestion(questionNumber: number): QuestionTemplate | null {
  if (questionNumber >= questionTemplates.length) {
    return null;
  }
  return questionTemplates[questionNumber];
}