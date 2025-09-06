### 2.3 Crypto Mini App Frontend with Archetype Visualization
- [ ] **Task 2.3.1**: Build crypto interview chat UI with archetype indicators
  ```typescript
  // File: components/CryptoInterviewChat.tsx
  import { useChat } from '@ai-sdk/react';
  import { useMiniKit } from '@coinbase/onchainkit/minikit';
  import { useEffect, useState } from 'react';
  
  export default function CryptoInterviewChat() {
    const [questionCount, setQuestionCount] = useState(0);
    const [archetypeSignals, setArchetypeSignals] = useState({---

## Phase 5: Social Features & Viral Mechanics 
### 5.1 Viral Growth Implementation
- [ ] **Task 5.1.1**: Build viral sharing system
  ```typescript
  // File: lib/viral/sharing.ts
  export class ViralSharingEngine {
    generateShareContent(matchResults: MatchResult[], userContext: SocialContext) {
      const topMatch = matchResults[0];
      const templates = [
        `Just found my perfect mentor! 🎯 ${topMatch.compatibilityScore}% match with @${topMatch.mentor.username}`,
        `AI matched me with an amazing mentor in my field! Try it yourself:`,
        `${topMatch.compatibilityScore}% compatibility! This AI mentor matching is incredible 🚀`
      ];
      
      return {
        text: templates[Math.floor(Math.random() * templates.length)],
        embed: `${process.env.NEXT_PUBLIC_URL}?ref=${user# Implementation Task List
## AI Agent Mentor Matchmaker

**Project Timeline:** 8-10 weeks  
**Team Size:** 3-4 developers  
**Technology Stack:** Vercel AI SDK 5.0, OpenRouter, Weaviate, Next.js  

---

## Phase 1: Foundation Setup 

### 1.1 Development Environment Setup
- [ ] **Task 1.1.1**: Initialize Next.js project with TypeScript
  - Create new Next.js 14 project: `npx create-next-app@latest mentor-matchmaker --typescript --tailwind --app`
  - Configure TypeScript strict mode and path aliases
  - Set up ESLint and Prettier configuration
  - **Estimate**: 4 hours
  - **Dependencies**: Node.js 18+, npm/yarn

- [ ] **Task 1.1.2**: Install and configure Vercel AI SDK
  - Install packages: `npm install ai @ai-sdk/openai @ai-sdk/openrouter zod`
  - Configure AI SDK with OpenRouter provider
  - Set up environment variables for API keys
  - **Estimate**: 3 hours
  - **Dependencies**: OpenRouter API key

- [ ] **Task 1.1.3**: Set up Weaviate vector database
  - Create Weaviate Cloud Services (WCS) instance
  - Install Weaviate client: `npm install weaviate-client`
  - Configure connection with API keys and endpoints
  - Test basic connectivity and authentication
  - **Estimate**: 4 hours
  - **Dependencies**: WCS account, OpenAI API key for embeddings

### 1.2 OpenRouter Integration Research
- [ ] **Task 1.2.1**: Research OpenRouter model selection strategy
  - Test different models for conversation vs. JSON generation
  - Document model performance and cost analysis
  - Create model selection logic based on task type
  - **Estimate**: 6 hours
  - **Deliverable**: Model selection strategy document

- [ ] **Task 1.2.2**: Implement OpenRouter provider configuration
  ```typescript
  // File: lib/openrouter.ts
  import { createOpenRouter } from '@openrouter/ai-sdk-provider';
  
  export const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1'
  });
  
  export const modelConfig = {
    conversation: 'anthropic/claude-3.5-sonnet:floor', // Cost-optimized
    jsonGeneration: 'openai/gpt-4o-mini', // Structured output
    matching: 'openai/gpt-4o' // High quality analysis
  };
  ```
  - **Estimate**: 3 hours
  - **Dependencies**: Task 1.2.1 completion

### 1.3 Weaviate Schema Design
- [ ] **Task 1.3.1**: Design mentor profile schema
  ```typescript
  // File: lib/weaviate/schemas.ts
  export const mentorSchema = {
    class: 'MentorProfile',
    properties: [
      { name: 'fullName', dataType: 'text' },
      { name: 'email', dataType: 'text' },
      { name: 'bio', dataType: 'text' },
      { name: 'expertise', dataType: 'text[]' },
      { name: 'industry', dataType: 'text[]' },
      { name: 'yearsExperience', dataType: 'int' },
      { name: 'availabilityTimezone', dataType: 'text' },
      { name: 'mentoringStype', dataType: 'text' },
      { name: 'profileType', dataType: 'text' }
    ],
    vectorizer: 'text2vec-openai',
    moduleConfig: {
      'text2vec-openai': {
        model: 'text-embedding-ada-002',
        vectorizeClassName: false
      }
    }
  };
  ```
  - **Estimate**: 4 hours
  - **Dependencies**: PRD review, Weaviate documentation

- [ ] **Task 1.3.2**: Design mentee profile schema
  - Create complementary schema for mentee profiles
  - Ensure compatibility with mentor schema for matching
  - Define vector embedding strategy for profiles
  - **Estimate**: 3 hours
  - **Dependencies**: Task 1.3.1

- [ ] **Task 1.3.3**: Initialize Weaviate collections
  ```typescript
  // File: lib/weaviate/setup.ts
  import weaviate from 'weaviate-client';
  
  export async function initializeCollections() {
    const client = await weaviate.connectToWeaviateCloud(
      process.env.WEAVIATE_URL,
      {
        authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
        headers: { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY }
      }
    );
    
    await client.collections.create(mentorSchema);
    await client.collections.create(menteeSchema);
  }
  ```
  - **Estimate**: 2 hours
  - **Dependencies**: Tasks 1.3.1, 1.3.2

---

## Phase 2: AI Agent Development 

### 2.1 5-Question Interview System
- [ ] **Task 2.1.1**: Design conversation flow state management
  ```typescript
  // File: types/interview.ts
  export interface InterviewState {
    sessionId: string;
    currentQuestion: number;
    maxQuestions: 5;
    responses: InterviewResponse[];
    generatedProfile?: MenteeProfile;
    isComplete: boolean;
  }
  
  export interface InterviewResponse {
    questionNumber: number;
    question: string;
    response: string;
    followUpQuestions?: string[];
    extractedData: Partial<MenteeProfile>;
  }
  ```
  - **Estimate**: 3 hours
  - **Dependencies**: TypeScript setup

- [ ] **Task 2.1.2**: Implement question generation system
  ```typescript
  // File: lib/interview/questions.ts
  export const questionTemplates = {
    1: {
      category: 'learning_goals',
      prompt: `Ask about their specific learning objectives and career goals in mentoring. 
      Focus on: skill development, career transition, knowledge gaps.`,
      required_fields: ['learning_objectives', 'career_goals', 'skill_gaps']
    },
    2: {
      category: 'current_background', 
      prompt: `Learn about their current role, experience level, and industry background.
      Focus on: current position, years of experience, industry context.`,
      required_fields: ['current_role', 'experience_level', 'industry_background']
    }
    // ... continue for all 5 questions
  };
  ```
  - **Estimate**: 5 hours
  - **Dependencies**: PRD question framework

- [ ] **Task 2.1.3**: Build AI agent conversation handler
  ```typescript
  // File: app/api/interview/route.ts
  import { streamText } from 'ai';
  import { openrouter, modelConfig } from '@/lib/openrouter';
  
  export async function POST(req: Request) {
    const { sessionId, response, questionNumber } = await req.json();
    
    if (questionNumber > 5) {
      return generateProfile(sessionId);
    }
    
    const result = streamText({
      model: openrouter(modelConfig.conversation),
      system: getQuestionPrompt(questionNumber),
      messages: buildConversationHistory(sessionId),
      maxTokens: 150,
      temperature: 0.7
    });
    
    return result.toDataStreamResponse();
  }
  ```
  - **Estimate**: 8 hours
  - **Dependencies**: Tasks 2.1.1, 2.1.2, OpenRouter setup

### 2.2 Profile Generation System
- [ ] **Task 2.2.1**: Implement JSON profile generation
  ```typescript
  // File: lib/profile/generator.ts
  import { generateObject } from 'ai';
  import { z } from 'zod';
  
  const MenteeProfileSchema = z.object({
    personal_info: z.object({
      name: z.string(),
      email: z.string().email(),
      timezone: z.string()
    }),
    learning_objectives: z.object({
      primary_goals: z.array(z.string()),
      skill_gaps: z.array(z.string()),
      career_stage: z.enum(['early_career', 'mid_career', 'senior', 'executive']),
      timeline: z.enum(['3_months', '6_months', '1_year', 'ongoing'])
    })
    // ... complete schema
  });
  
  export async function generateMenteeProfile(conversationData: InterviewResponse[]) {
    const { object: profile } = await generateObject({
      model: openrouter(modelConfig.jsonGeneration),
      schema: MenteeProfileSchema,
      system: 'Generate a comprehensive mentee profile from interview responses.',
      prompt: buildProfilePrompt(conversationData)
    });
    
    return profile;
  }
  ```
  - **Estimate**: 6 hours
  - **Dependencies**: Zod schemas, interview data

- [ ] **Task 2.2.2**: Implement profile validation and sanitization
  - Add data quality checks for generated profiles
  - Standardize industry terms and experience levels
  - Validate required fields are populated
  - **Estimate**: 4 hours
  - **Dependencies**: Task 2.2.1

### 2.3 Frontend Interview Interface
- [ ] **Task 2.3.1**: Build interview chat UI
  ```typescript
  // File: components/InterviewChat.tsx
  import { useChat } from '@ai-sdk/react';
  import { useState } from 'react';
  
  export default function InterviewChat() {
    const [questionCount, setQuestionCount] = useState(0);
    const MAX_QUESTIONS = 5;
    
    const { messages, input, handleSubmit, isLoading } = useChat({
      api: '/api/interview',
      onFinish: (message) => {
        if (questionCount >= MAX_QUESTIONS) {
          handleInterviewComplete();
        }
      }
    });
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-4">
          <div className="text-sm text-gray-600">
            Question {questionCount + 1} of {MAX_QUESTIONS}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((questionCount + 1) / MAX_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-sm p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your response..."
            disabled={isLoading || questionCount >= MAX_QUESTIONS}
            className="flex-1 p-3 border rounded-lg"
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Send'}
          </button>
        </form>
      </div>
    );
  }
  ```
  - **Estimate**: 8 hours
  - **Dependencies**: Vercel AI SDK useChat hook

- [ ] **Task 2.3.2**: Add progress tracking and validation
  - Visual progress indicator for question completion
  - Input validation and error handling
  - Session persistence for incomplete interviews
  - **Estimate**: 4 hours
  - **Dependencies**: Task 2.3.1

---

## Phase 3: Pinecone Vector Search Integration

### 3.1 Crypto Mentor Profile Management with Pinecone
- [ ] **Task 3.1.1**: Build mentor profile import system for Pinecone
  ```typescript
  // File: lib/pinecone/mentors.ts
  import { Pinecone } from '@pinecone-database/pinecone';
  import { getEmbedding } from '@/lib/embeddings';
  
  export async function importCryptoMentorProfile(mentor: CryptoMentorProfile) {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index('crypto-mentors');
    
    // Create comprehensive text for embedding
    const embedText = buildMentorEmbeddingText(mentor);
    const embedding = await getEmbedding(embedText);
    
    const vector: CryptoMentorVector = {
      id: `mentor_${mentor.fid}`,
      values: embedding,
      metadata: {
        fullName: mentor.fullName,
        farcasterUsername: mentor.farcasterUsername,
        fid: mentor.fid,
        bio: mentor.bio,
        primaryArchetype: mentor.primaryArchetype,
        specializations: mentor.specializations,
        yearsInCrypto: mentor.yearsInCrypto,
        notableAchievements: mentor.notableAchievements,
        currentProjects: mentor.currentProjects,
        teachingStyle: mentor.teachingStyle,
        teachingFocus: mentor.teachingFocus,
        communicationStyle: mentor.communicationStyle,
        availability: mentor.availability,
        timezone: mentor.timezone,
        preferredSessionFormat: mentor.preferredSessionFormat,
        successfulMentees: mentor.successfulMentees,
        communityReputation: mentor.communityReputation,
        socialVerified: mentor.socialVerified
      }
    };
    
    await index.upsert([vector]);
    return vector;
  }
  
  function buildMentorEmbeddingText(mentor: CryptoMentorProfile): string {
    return [
      mentor.bio,
      `Specializes in: ${mentor.specializations.join(', ')}`,
      `Teaching style: ${mentor.teachingStyle}`,
      `Experience: ${mentor.yearsInCrypto} years in crypto`,
      `Achievements: ${mentor.notableAchievements.join(', ')}`,
      `Current projects: ${mentor.currentProjects.join(', ')}`,
      `Archetype: ${mentor.primaryArchetype}`
    ].join(' ');
  }
  ```
  - **Estimate**: 6 hours
  - **Dependencies**: Pinecone setup, mentor data structure

- [ ] **Task 3.1.2**: Create bulk import functionality for mentor profiles
  ```typescript
  // File: lib/pinecone/bulkImport.ts
  export async function bulkImportMentors(mentors: CryptoMentorProfile[]) {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index('crypto-mentors');
    
    const BATCH_SIZE = 100; // Pinecone batch limit
    const batches = chunkArray(mentors, BATCH_SIZE);
    
    for (const batch of batches) {
      const vectors = await Promise.all(
        batch.map(async (mentor) => {
          const embedText = buildMentorEmbeddingText(mentor);
          const embedding = await getEmbedding(embedText);
          
          return {
            id: `mentor_${mentor.fid}`,
            values: embedding,
            metadata: extractMentorMetadata(mentor)
          };
        })
      );
      
      await index.upsert(vectors);
      
      // Rate limiting to avoid API limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  ```
  - **Estimate**: 5 hours
  - **Dependencies**: Task 3.1.1

- [ ] **Task 3.1.3**: Build mentor profile CRUD operations
  ```typescript
  // File: lib/pinecone/mentorOperations.ts
  export class MentorProfileManager {
    private pinecone: Pinecone;
    private index: any;
    
    constructor() {
      this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
      this.index = this.pinecone.Index('crypto-mentors');
    }
    
    async createMentor(mentor: CryptoMentorProfile) {
      const vector = await createMentorVector(mentor);
      await this.index.upsert([vector]);
      return vector;
    }
    
    async updateMentor(mentorId: string, updates: Partial<CryptoMentorProfile>) {
      // Pinecone doesn't support partial updates, so we need to fetch and re-upsert
      const existing = await this.getMentor(mentorId);
      if (!existing) throw new Error('Mentor not found');
      
      const updatedMentor = { ...existing, ...updates };
      const vector = await createMentorVector(updatedMentor);
      await this.index.upsert([vector]);
      return vector;
    }
    
    async deleteMentor(mentorId: string) {
      await this.index.deleteOne(`mentor_${mentorId}`);
    }
    
    async getMentor(mentorId: string) {
      const result = await this.index.fetch([`mentor_${mentorId}`]);
      return result.vectors[`mentor_${mentorId}`];
    }
    
    async listMentors(filters?: any) {
      // Use query with filters to list mentors
      const dummyVector = new Array(1536).fill(0); // Zero vector for listing
      
      const result = await this.index.query({
        vector: dummyVector,
        filter: filters,
        topK: 100,
        includeMetadata: true
      });
      
      return result.matches;
    }
  }
  ```
  - **Estimate**: 4 hours
  - **Dependencies**: Task 3.1.1

### 3.2 Vector Search Implementation with Pinecone
- [ ] **Task 3.2.1**: Implement semantic search for mentor matching
  ```typescript
  // File: lib/matching/pineconeSearch.ts
  import { Pinecone } from '@pinecone-database/pinecone';
  
  export async function findCryptoMentorMatches(
    newcomerProfile: CryptoNewcomerProfile
  ): Promise<MatchResult[]> {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index('crypto-mentors');
    
    // Build search query from newcomer profile
    const queryText = buildSearchQuery(newcomerProfile);
    const queryEmbedding = await getEmbedding(queryText);
    
    // Build archetype-specific filters
    const filters = buildArchetypeFilters(newcomerProfile.archetype_classification);
    
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: 20,
      filter: filters,
      includeMetadata: true,
      namespace: `mentors-${newcomerProfile.archetype_classification.primary_archetype}`
    });
    
    const matches = searchResults.matches?.map(match => ({
      mentor: match.metadata,
      similarity_score: match.score || 0,
      match_explanation: generateMatchExplanation(newcomerProfile, match.metadata)
    })) || [];
    
    // Apply additional scoring and ranking
    return rankMatches(matches, newcomerProfile);
  }
  
  function buildSearchQuery(profile: CryptoNewcomerProfile): string {
    const goals = profile.crypto_interests.primary_goals.join(' ');
    const motivation = profile.crypto_interests.entry_motivation.join(' ');
    const preferences = profile.learning_preferences.learning_style.join(' ');
    const archetype = profile.archetype_classification.primary_archetype;
    
    return `${goals} ${motivation} ${preferences} ${archetype} crypto mentoring`;
  }
  
  function buildArchetypeFilters(archetype: ArchetypeClassification) {
    const baseFilters = {
      availability: { $eq: true },
      yearsInCrypto: { $gte: 2 }
    };
    
    switch (archetype.primary_archetype) {
      case 'investor':
        return {
          ...baseFilters,
          $or: [
            { specializations: { $in: ["trading", "defi", "portfolio_management"] } },
            { primaryArchetype: { $eq: "investor" } }
          ]
        };
      case 'developer':
        return {
          ...baseFilters,
          $or: [
            { specializations: { $in: ["smart_contracts", "dapp_development", "solidity"] } },
            { primaryArchetype: { $eq: "developer" } }
          ]
        };
      case 'social_user':
        return {
          ...baseFilters,
          $or: [
            { specializations: { $in: ["community_building", "dao_governance", "networking"] } },
            { primaryArchetype: { $eq: "social_user" } }
          ]
        };
      default:
        return baseFilters;
    }
  }
  ```
  - **Estimate**: 8 hours
  - **Dependencies**: Pinecone setup, mentor profiles

- [ ] **Task 3.2.2**: Implement hybrid search with metadata filtering
  ```typescript
  // File: lib/matching/hybridSearch.ts
  export async function hybridCryptoSearch(
    newcomerProfile: CryptoNewcomerProfile,
    preferences: SearchPreferences = {}
  ): Promise<MatchResult[]> {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index('crypto-mentors');
    
    // Multi-stage search strategy
    const searchStrategies = [
      // 1. Exact archetype match with high similarity
      {
        namespace: `mentors-${newcomerProfile.archetype_classification.primary_archetype}`,
        filter: {
          primaryArchetype: { $eq: newcomerProfile.archetype_classification.primary_archetype },
          availability: { $eq: true }
        },
        weight: 0.5
      },
      // 2. Cross-archetype mentors with overlapping skills
      {
        namespace: 'mentors-all',
        filter: {
          specializations: { 
            $in: newcomerProfile.mentor_requirements.desired_expertise 
          },
          availability: { $eq: true }
        },
        weight: 0.3
      },
      // 3. High-reputation mentors regardless of exact match
      {
        namespace: 'mentors-all',
        filter: {
          communityReputation: { $gte: 8 },
          successfulMentees: { $gte: 5 },
          availability: { $eq: true }
        },
        weight: 0.2
      }
    ];
    
    const queryText = buildSearchQuery(newcomerProfile);
    const queryEmbedding = await getEmbedding(queryText);
    
    const allResults: MatchResult[] = [];
    
    for (const strategy of searchStrategies) {
      const results = await index.query({
        vector: queryEmbedding,
        topK: 10,
        filter: strategy.filter,
        includeMetadata: true,
        namespace: strategy.namespace
      });
      
      const strategyMatches = results.matches?.map(match => ({
        mentor: match.metadata,
        similarity_score: (match.score || 0) * strategy.weight,
        match_explanation: generateMatchExplanation(newcomerProfile, match.metadata),
        search_strategy: strategy.namespace
      })) || [];
      
      allResults.push(...strategyMatches);
    }
    
    // Deduplicate and rank
    const deduplicatedResults = deduplicateByMentorId(allResults);
    return rankMatches(deduplicatedResults, newcomerProfile).slice(0, 5);
  }
  
  function deduplicateByMentorId(results: MatchResult[]): MatchResult[] {
    const seen = new Set();
    return results.filter(result => {
      const mentorId = result.mentor.fid;
      if (seen.has(mentorId)) return false;
      seen.add(mentorId);
      return true;
    });
  }
  ```
  - **Estimate**: 6 hours
  - **Dependencies**: Task 3.2.1hours
  - **Dependencies**: Task 3.1.1

### 3.2 Vector Search Implementation
- [ ] **Task 3.2.1**: Implement hybrid search functionality
  ```typescript
  // File: lib/matching/search.ts
  export async function findMentorMatches(menteeProfile: MenteeProfile): Promise<MatchResult[]> {
    const client = await getWeaviateClient();
    const mentors = client.collections.get('MentorProfile');
    
    const searchQuery = buildSearchQuery(menteeProfile);
    
    // Hybrid search combining semantic and keyword matching
    const results = await mentors.query.hybrid(
      searchQuery,
      {
        alpha: 0.7, // 70% semantic, 30% keyword weight
        limit: 10,
        returnMetadata: ['distance', 'score'],
        where: buildFilterCriteria(menteeProfile)
      }
    );
    
    return results.objects.map(mentor => ({
      mentor: mentor.properties,
      similarity_score: mentor.metadata?.score || 0,
      match_explanation: generateMatchExplanation(menteeProfile, mentor.properties)
    }));
  }
  
  function buildSearchQuery(profile: MenteeProfile): string {
    const goals = profile.learning_objectives.primary_goals.join(' ');
    const expertise = profile.mentor_requirements.desired_expertise.join(' ');
    const industry = profile.mentor_requirements.industry_preference.join(' ');
    
    return `${goals} ${expertise} ${industry} mentoring coaching leadership`;
  }
  ```
  - **Estimate**: 8 hours
  - **Dependencies**: Weaviate setup, mentor profiles

- [ ] **Task 3.2.2**: Implement advanced filtering
  - Timezone compatibility filtering
  - Experience level matching
  - Availability overlap detection
  - Industry and domain expertise filtering
  - **Estimate**: 6 hours
  - **Dependencies**: Task 3.2.1

### 3.3 Match Scoring Algorithm
- [ ] **Task 3.3.1**: Build multi-factor scoring system
  ```typescript
  // File: lib/matching/scoring.ts
  export function calculateMatchScore(mentee: MenteeProfile, mentor: MentorProfile): MatchScore {
    const scores = {
      expertise_alignment: calculateExpertiseScore(mentee, mentor),
      communication_compatibility: calculateCommunicationScore(mentee, mentor),
      industry_relevance: calculateIndustryScore(mentee, mentor),
      availability_overlap: calculateAvailabilityScore(mentee, mentor),
      experience_gap: calculateExperienceGapScore(mentee, mentor)
    };
    
    const weights = {
      expertise_alignment: 0.35,
      communication_compatibility: 0.25,
      industry_relevance: 0.20,
      availability_overlap: 0.15,
      experience_gap: 0.05
    };
    
    const overall_score = Object.entries(scores)
      .reduce((total, [key, score]) => total + (score * weights[key]), 0);
    
    return {
      overall_score,
      component_scores: scores,
      explanation: generateScoreExplanation(scores, weights)
    };
  }
  ```
  - **Estimate**: 8 hours
  - **Dependencies**: Profile schemas, business logic

- [ ] **Task 3.3.2**: Add match explanation generation
  - Natural language explanations for matches
  - Highlight key compatibility factors
  - Suggest conversation starters
  - **Estimate**: 4 hours
  - **Dependencies**: Task 3.3.1

---

## Phase 4: API Development (Week 7)

### 4.1 Core API Endpoints
- [ ] **Task 4.1.1**: Build interview management API
  ```typescript
  // File: app/api/interview/start/route.ts
  export async function POST(req: Request) {
    const { mentee_id, user_info } = await req.json();
    
    const sessionId = generateSessionId();
    const firstQuestion = await generateFirstQuestion();
    
    await storeInterviewSession({
      sessionId,
      menteeId: mentee_id,
      userInfo: user_info,
      currentQuestion: 1,
      startTime: new Date(),
      responses: []
    });
    
    return NextResponse.json({
      session_id: sessionId,
      first_question: firstQuestion,
      progress: { current: 1, total: 5 }
    });
  }
  ```
  - **Estimate**: 6 hours
  - **Dependencies**: Interview system, database setup

- [ ] **Task 4.1.2**: Build matching API endpoints
  ```typescript
  // File: app/api/matches/find/route.ts
  export async function POST(req: Request) {
    const { mentee_profile } = await req.json();
    
    const startTime = Date.now();
    
    try {
      const matches = await findMentorMatches(mentee_profile);
      const rankedMatches = matches
        .map(match => ({
          ...match,
          match_score: calculateMatchScore(mentee_profile, match.mentor)
        }))
        .sort((a, b) => b.match_score.overall_score - a.match_score.overall_score)
        .slice(0, 5);
      
      return NextResponse.json({
        matches: rankedMatches,
        total_count: matches.length,
        search_time_ms: Date.now() - startTime
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Matching failed', details: error.message },
        { status: 500 }
      );
    }
  }
  ```
  - **Estimate**: 5 hours
  - **Dependencies**: Matching system

### 4.2 Error Handling and Validation
- [ ] **Task 4.2.1**: Implement comprehensive error handling
  - API error responses with proper HTTP status codes
  - Logging and monitoring integration
  - Graceful degradation for service failures
  - **Estimate**: 4 hours
  - **Dependencies**: All API endpoints

- [ ] **Task 4.2.2**: Add request validation middleware
  - Schema validation for all API inputs
  - Rate limiting and abuse prevention
  - Authentication and authorization
  - **Estimate**: 3 hours
  - **Dependencies**: Task 4.2.1

---

## Phase 5: Frontend Integration 

### 5.1 Match Results Interface
- [ ] **Task 5.1.1**: Build mentor match display component
  ```typescript
  // File: components/MatchResults.tsx
  interface MatchResultsProps {
    matches: MatchResult[];
    menteeProfile: MenteeProfile;
  }
  
  export default function MatchResults({ matches, menteeProfile }: MatchResultsProps) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Mentor Matches</h2>
        
        {matches.map((match, index) => (
          <div key={match.mentor.id} className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{match.mentor.fullName}</h3>
                <p className="text-gray-600">{match.mentor.currentRole}</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">Match Score:</span>
                    <div className="ml-2 flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${match.match_score.overall_score * 100}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {Math.round(match.match_score.overall_score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Connect
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-gray-700">Expertise</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {match.mentor.expertise.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Experience</h4>
                <p className="text-sm text-gray-600">{match.mentor.yearsExperience}+ years</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Why this is a good match</h4>
              <p className="text-sm text-gray-600">{match.match_explanation}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```
  - **Estimate**: 8 hours
  - **Dependencies**: Match data structure, design system

- [ ] **Task 5.1.2**: Add match comparison functionality
  - Side-by-side mentor comparison
  - Detailed match score breakdowns
  - Filtering and sorting options
  - **Estimate**: 6 hours
  - **Dependencies**: Task 5.1.1

### 5.2 Complete User Flow
- [ ] **Task 5.2.1**: Integrate all components into full user journey
  - Landing page with clear value proposition
  - Seamless flow from interview to matches
  - Profile review and edit functionality
  - **Estimate**: 6 hours
  - **Dependencies**: All previous frontend components

- [ ] **Task 5.2.2**: Add responsive design and mobile optimization
  - Mobile-first responsive design
  - Touch-friendly interface elements
  - Performance optimization for mobile
  - **Estimate**: 4 hours
  - **Dependencies**: Task 5.2.1

---

## Phase 6: Testing & Deployment (Week 9-10)

### 6.1 Testing Implementation
- [ ] **Task 6.1.1**: Unit tests for core functions
  ```typescript
  // File: __tests__/matching.test.ts
  import { calculateMatchScore, findMentorMatches } from '@/lib/matching';
  
  describe('Matching Algorithm', () => {
    test('should calculate accurate match scores', () => {
      const mentee = mockMenteeProfile();
      const mentor = mockMentorProfile();
      
      const score = calculateMatchScore(mentee, mentor);
      
      expect(score.overall_score).toBeGreaterThan(0);
      expect(score.overall_score).toBeLessThanOrEqual(1);
      expect(score.component_scores).toHaveProperty('expertise_alignment');
    });
    
    test('should find relevant mentor matches', async () => {
      const mentee = mockMenteeProfile();
      
      const matches = await findMentorMatches(mentee);
      
      expect(matches).toHaveLength(5);
      expect(matches[0].similarity_score).toBeGreaterThan(0.5);
    });
  });
  ```
  - **Estimate**: 8 hours
  - **Dependencies**: Jest setup, core functionality

- [ ] **Task 6.1.2**: Integration tests for API endpoints
  - Test all API endpoints with various inputs
  - Error handling and edge case testing
  - Performance testing under load
  - **Estimate**: 6 hours
  - **Dependencies**: Task 6.1.1

- [ ] **Task 6.1.3**: End-to-end testing
  - Complete user journey testing with Playwright
  - Cross-browser compatibility testing
  - Mobile device testing
  - **Estimate**: 8 hours
  - **Dependencies**: Complete application

### 6.2 Performance Optimization
- [ ] **Task 6.2.1**: Optimize API response times
  - Database query optimization
  - Caching implementation for frequent searches
  - Connection pooling setup
  - **Estimate**: 6 hours
  - **Dependencies**: Performance testing results

- [ ] **Task 6.2.2**: Frontend performance optimization
  - Code splitting and lazy loading
  - Image optimization and CDN setup
  - Bundle size optimization
  - **Estimate**: 4 hours
  - **Dependencies**: Frontend implementation

### 6.3 Deployment Setup
- [ ] **Task 6.3.1**: Production environment configuration
  - Vercel deployment configuration
  - Environment variable setup
  - Domain and SSL configuration
  - **Estimate**: 3 hours
  - **Dependencies**: Complete application

- [ ] **Task 6.3.2**: Monitoring and analytics setup
  - Error tracking with Sentry
  - Performance monitoring
  - User analytics setup
  - **Estimate**: 4 hours
  - **Dependencies**: Task 6.3.1

---

## Technical Dependencies & Prerequisites

### External Services Setup
1. **OpenRouter Account**
   - Create account at openrouter.ai
   - Purchase initial credits ($50 recommended for development)
   - Generate API key and configure rate limits

2. **Weaviate Cloud Services**
   - Sign up for WCS account
   - Create development cluster (free tier available)
   - Note cluster URL and API credentials

3. **OpenAI API (for embeddings)**
   - Create OpenAI account for text-embedding-ada-002
   - Alternative: Use Cohere or HuggingFace for embeddings

### Development Tools
- **Node.js 18+** with npm/yarn package manager
- **TypeScript** for type safety across the application
- **Next.js 14** with App Router for full-stack development
- **Tailwind CSS** for responsive styling
- **Git** for version control with branching strategy

### Estimated Resource Requirements
- **Development Time**: 280-320 hours total
- **Team Composition**: 1 senior full-stack developer + 1 AI/ML specialist + 1 frontend developer
- **Infrastructure Costs**: $100-200/month for development/testing
- **Production Scaling**: Plan for $500-1000/month at 1000+ active users

---

## Quality Gates & Checkpoints

### Phase Completion Criteria
Each phase must meet these criteria before proceeding:

**Phase 1**: Foundation
- [ ] All services connect successfully
- [ ] Basic API endpoints respond correctly
- [ ] Database schemas created and tested

**Phase 2**: AI Agent
- [ ] 5-question interview completes successfully
- [ ] Profile generation produces valid JSON
- [ ] Conversation flow handles edge cases

**Phase 3**: Vector Search
- [ ] Mentor profiles import without errors
- [ ] Search returns relevant results in <2 seconds
- [ ] Match scoring produces reasonable rankings

**Phase 4**: API Integration
- [ ] All endpoints documented with OpenAPI
- [ ] Error handling covers all failure modes
- [ ] Performance meets target metrics

**Phase 5**: Frontend
- [ ] Complete user journey works end-to-end
- [ ] Mobile responsive design implemented
- [ ] Accessibility standards met (WCAG 2.1 AA)

**Phase 6**: Deployment
- [ ] All tests pass with >90% coverage
- [ ] Load testing validates performance targets
- [ ] Production deployment successful

### Success Metrics Tracking
Monitor these metrics throughout development:
- **API Response Time**: <500ms for 95th percentile
- **Interview Completion Rate**: >85% of started sessions
- **Profile Generation Accuracy**: >90% user approval
- **Match Relevance**: >0.7 average similarity score
- **System Uptime**: >99.5% availability