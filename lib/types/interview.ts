import { z } from 'zod';

// Crypto-specific archetype types
export type CryptoArchetype = 'investor' | 'developer' | 'social_user';

// Interview state management
export interface InterviewState {
  sessionId: string;
  walletAddress?: string;
  currentQuestion: number;
  maxQuestions: number;
  responses: InterviewResponse[];
  archetypeSignals: ArchetypeSignals;
  generatedProfile?: CryptoNewcomerProfile;
  isComplete: boolean;
  startTime: Date;
}

export interface InterviewResponse {
  questionNumber: number;
  question: string;
  response: string;
  followUpQuestions?: string[];
  extractedData: Partial<CryptoNewcomerProfile>;
  timestamp: Date;
}

export interface ArchetypeSignals {
  investor: number;
  developer: number;
  social_user: number;
}

// Zod schemas for profile generation
export const ArchetypeClassificationSchema = z.object({
  primary_archetype: z.enum(['investor', 'developer', 'social_user']),
  confidence_scores: z.object({
    investor: z.number().min(0).max(1),
    developer: z.number().min(0).max(1),
    social_user: z.number().min(0).max(1),
  }),
  signals: z.array(z.string()),
});

export const CryptoInterestsSchema = z.object({
  primary_goals: z.array(z.string()),
  specific_interests: z.array(z.string()),
  knowledge_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  entry_motivation: z.array(z.string()),
  risk_tolerance: z.enum(['conservative', 'moderate', 'aggressive']),
});

export const CurrentBackgroundSchema = z.object({
  role: z.string(),
  industry: z.string(),
  experience_level: z.enum(['0-2', '3-5', '6-10', '10+']),
  technical_proficiency: z.enum(['non_technical', 'basic', 'intermediate', 'advanced']),
  previous_crypto_experience: z.enum(['none', 'exploring', 'active', 'experienced']),
  blockchain_familiarity: z.array(z.string()),
});

export const LearningPreferencesSchema = z.object({
  learning_style: z.array(z.enum(['hands_on', 'structured', 'informal', 'project_based', 'theoretical'])),
  communication_style: z.enum(['direct', 'collaborative', 'supportive', 'challenging']),
  meeting_frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'as_needed']),
  format_preference: z.array(z.enum(['video', 'phone', 'text', 'async'])),
  time_commitment: z.enum(['low', 'medium', 'high']),
});

export const MentorRequirementsSchema = z.object({
  desired_expertise: z.array(z.string()),
  archetype_preference: z.enum(['investor', 'developer', 'social_user', 'any']),
  minimum_experience: z.enum(['1_year', '3_years', '5_years', '10_years', 'no_preference']),
  specific_skills: z.array(z.string()),
  language_preferences: z.array(z.string()),
});

export const LogisticsSchema = z.object({
  availability: z.object({
    days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
    times: z.array(z.enum(['morning', 'afternoon', 'evening', 'night'])),
    timezone: z.string(),
  }),
  commitment_level: z.enum(['casual', 'moderate', 'intensive']),
  duration_expectation: z.enum(['1_month', '3_months', '6_months', '1_year', 'ongoing']),
});

// Complete profile schema for crypto newcomers
export const CryptoNewcomerProfileSchema = z.object({
  id: z.string(),
  created_at: z.date(),
  wallet_address: z.string().optional(),
  profile_type: z.literal('newcomer'),
  
  personal_info: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    timezone: z.string(),
    preferred_name: z.string().optional(),
  }),
  
  archetype_classification: ArchetypeClassificationSchema,
  crypto_interests: CryptoInterestsSchema,
  current_background: CurrentBackgroundSchema,
  learning_preferences: LearningPreferencesSchema,
  mentor_requirements: MentorRequirementsSchema,
  logistics: LogisticsSchema,
  
  vector_embedding: z.array(z.number()).optional(),
  search_keywords: z.array(z.string()),
});

// Mentor profile schema
export const CryptoMentorProfileSchema = z.object({
  id: z.string(),
  created_at: z.date(),
  profile_type: z.literal('mentor'),
  
  personal_info: z.object({
    fullName: z.string(),
    email: z.string().email(),
    farcasterUsername: z.string().optional(),
    fid: z.string().optional(),
    timezone: z.string(),
    bio: z.string(),
  }),
  
  crypto_expertise: z.object({
    primary_archetype: z.enum(['investor', 'developer', 'social_user']),
    specializations: z.array(z.string()),
    years_in_crypto: z.number(),
    notable_achievements: z.array(z.string()),
    current_projects: z.array(z.string()),
    blockchain_expertise: z.array(z.string()),
  }),
  
  mentoring_approach: z.object({
    teaching_style: z.enum(['directive', 'supportive', 'coaching', 'collaborative']),
    teaching_focus: z.array(z.string()),
    communication_style: z.enum(['direct', 'collaborative', 'supportive', 'challenging']),
    strengths: z.array(z.string()),
    preferred_mentee_level: z.array(z.enum(['beginner', 'intermediate', 'advanced'])),
  }),
  
  availability: z.object({
    is_available: z.boolean(),
    days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
    times: z.array(z.enum(['morning', 'afternoon', 'evening', 'night'])),
    timezone: z.string(),
    preferred_format: z.array(z.enum(['video', 'phone', 'text', 'async'])),
    max_mentees: z.number(),
    current_mentees: z.number(),
  }),
  
  metrics: z.object({
    successful_mentees: z.number(),
    community_reputation: z.number().min(0).max(10),
    response_time: z.enum(['immediate', 'same_day', 'next_day', 'weekly']),
    completion_rate: z.number().min(0).max(1),
  }),
  
  vector_embedding: z.array(z.number()).optional(),
  search_keywords: z.array(z.string()),
});

// Type exports
export type CryptoNewcomerProfile = z.infer<typeof CryptoNewcomerProfileSchema>;
export type CryptoMentorProfile = z.infer<typeof CryptoMentorProfileSchema>;
export type ArchetypeClassification = z.infer<typeof ArchetypeClassificationSchema>;

// Match result type
export interface MatchResult {
  mentor: CryptoMentorProfile;
  similarity_score: number;
  match_explanation: string;
  archetype_alignment: number;
  learning_path_suggestion?: string;
  search_strategy?: string;
  confidence_level?: 'very_high' | 'high' | 'medium' | 'low';
  risk_assessment?: {
    overall_risk: 'low' | 'medium' | 'high';
    risk_factors: string[];
  };
  component_scores?: {
    archetype_alignment: number;
    knowledge_gap_appropriateness: number;
    learning_style_compatibility: number;
    crypto_community_overlap: number;
    availability_match: number;
    reputation_factor: number;
  };
}