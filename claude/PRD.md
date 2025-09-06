# Product Requirements Document (PRD)
## AI Agent Mentor Matchmaker

**Version:** 1.0  
**Date:** September 2025  
**Team:** AI Development Team  

---

## 1. Executive Summary

### Product Vision
Create an intelligent AI agent that conducts standardized 5-question interviews with mentees to generate comprehensive user profiles and match them with optimal mentors from a RAG-powered database using Weaviate vector search.

### Key Value Propositions
- **Standardized Data Collection**: Ensure consistent profile information across all users through guided questioning
- **Intelligent Matching**: Use semantic similarity and vector search for optimal mentor-mentee pairings
- **Mentorship Focus**: Specifically designed for mentoring relationships with domain expertise matching
- **Scalable Architecture**: Modern tech stack supporting growth from hundreds to millions of profiles

---

## 2. Product Overview

### Core Problem Statement
Traditional mentor matching relies on manual processes, basic keyword matching, or lengthy forms that result in inconsistent data quality and poor matches. Organizations need an intelligent system that can:
- Gather standardized mentoring-specific information efficiently
- Match based on learning goals, expertise areas, and personality compatibility
- Scale mentor-mentee connections across organizations

### Solution Approach
An AI agent that conducts conversational interviews focused on mentoring needs, generating structured JSON profiles for semantic matching against mentor databases using vector similarity search.

---

## 3. Technical Architecture

### Technology Stack
- **AI Agent Framework**: Vercel AI SDK 5.0 with structured output generation
- **LLM Provider**: OpenRouter (access to 400+ models with intelligent routing)
- **Vector Database**: Weaviate with built-in RAG capabilities
- **Deployment**: Vercel platform with edge computing

### System Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Agent      │    │   OpenRouter     │    │   Weaviate DB   │
│ (Vercel AI SDK)│────│   (LLM Provider) │    │ (Vector Search) │
│ 5-Question Flow │    │   Model Routing  │    │ Mentor Profiles │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 4. User Experience Flow

### Mentee Onboarding Journey
1. **Welcome & Introduction** (30 seconds)
   - AI agent explains the mentoring matching process
   - Sets expectations for 5-question conversation

2. **Guided Interview** (3-5 minutes)
   - AI asks exactly 5 standardized questions
   - Natural conversation flow with follow-up clarifications
   - Progress indicator shows question count

3. **Profile Generation** (15 seconds)
   - AI processes responses into structured JSON profile
   - Confirmation screen shows generated profile summary

4. **Mentor Matching** (30 seconds)
   - Vector search finds top 3-5 mentor matches
   - Results display with compatibility explanations

5. **Connection Facilitation** (varies)
   - Contact information or introduction messaging
   - Calendar integration for initial meetings

---

## 5. AI Agent Question Framework

### Standardized 5-Question Structure
The AI agent must gather consistent information across these domains while maintaining conversational flow:

#### Question Categories (Each question targets specific profile fields):

**1. Learning Goals & Objectives**
- *Example*: "What specific skills or knowledge areas are you hoping to develop through mentoring?"
- *Profile Fields*: `learning_objectives`, `skill_gaps`, `career_goals`

**2. Current Experience & Background**
- *Example*: "Tell me about your current role and the relevant experience you bring."
- *Profile Fields*: `current_role`, `experience_level`, `industry_background`

**3. Preferred Learning Style & Communication**
- *Example*: "How do you prefer to learn and receive feedback - through hands-on practice, structured discussions, or regular check-ins?"
- *Profile Fields*: `learning_style`, `communication_preferences`, `meeting_frequency`

**4. Mentor Characteristics & Expertise**
- *Example*: "What type of expertise and background would you find most valuable in a mentor?"
- *Profile Fields*: `desired_mentor_expertise`, `industry_preference`, `mentor_experience_level`

**5. Logistics & Commitment**
- *Example*: "What's your availability and how often would you like to connect with a mentor?"
- *Profile Fields*: `availability`, `commitment_level`, `preferred_format`, `timezone`

### AI Agent Behavior Guidelines
- **Conversational Tone**: Friendly, professional, and encouraging
- **Adaptive Follow-ups**: Ask clarifying questions within each category
- **Question Limit Enforcement**: Strictly limit to 5 main questions
- **Context Retention**: Reference previous answers to build rapport
- **Completion Validation**: Ensure all required profile fields are populated

---

## 6. Profile Data Schema

### Mentee Profile Structure (JSON)
```json
{
  "id": "uuid",
  "created_at": "timestamp",
  "profile_type": "mentee",
  "personal_info": {
    "name": "string",
    "email": "string",
    "timezone": "string"
  },
  "learning_objectives": {
    "primary_goals": ["array of strings"],
    "skill_gaps": ["array of strings"],
    "career_stage": "early_career|mid_career|senior|executive",
    "timeline": "3_months|6_months|1_year|ongoing"
  },
  "current_background": {
    "role": "string",
    "industry": "string",
    "experience_level": "0-2|3-5|6-10|10+",
    "company_size": "startup|small|medium|large|enterprise",
    "previous_mentoring": "none|mentee|mentor|both"
  },
  "preferences": {
    "learning_style": ["hands_on", "structured", "informal", "project_based"],
    "communication_style": "direct|collaborative|supportive|challenging",
    "meeting_frequency": "weekly|biweekly|monthly|as_needed",
    "format_preference": ["video", "phone", "in_person", "text"],
    "group_vs_individual": "individual|group|either"
  },
  "mentor_requirements": {
    "desired_expertise": ["array of domains"],
    "industry_preference": ["array of industries"],
    "minimum_experience": "5_years|10_years|15_years|no_preference",
    "leadership_level": "ic|manager|director|vp|c_level|any",
    "company_types": ["startup", "corporate", "consulting", "nonprofit"]
  },
  "logistics": {
    "availability": {
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "times": ["morning", "afternoon", "evening"],
      "timezone": "string"
    },
    "commitment_level": "casual|moderate|intensive",
    "duration_expectation": "3_months|6_months|1_year|ongoing"
  },
  "vector_embedding": "float[]",
  "search_keywords": ["array of searchable terms"]
}
```

### Mentor Profile Schema (Reference)
```json
{
  "id": "uuid",
  "profile_type": "mentor",
  "personal_info": { /* similar structure */ },
  "expertise": {
    "primary_domains": ["array of expertise areas"],
    "years_experience": "number",
    "current_role": "string",
    "industry_experience": ["array of industries"],
    "specializations": ["array of specific skills"]
  },
  "mentoring_style": {
    "approach": "directive|supportive|coaching|collaborative",
    "strengths": ["array of mentoring strengths"],
    "focus_areas": ["career_development", "technical_skills", "leadership"]
  },
  "availability": { /* similar to mentee */ },
  "preferences": { /* mentor-specific preferences */ },
  "vector_embedding": "float[]"
}
```

---

## 7. Crypto Matching Algorithm with Pinecone

### Vector Similarity Approach with Crypto Specialization
1. **Profile Vectorization**: Generate embeddings using OpenAI's text-embedding-ada-002 model
2. **Pinecone Index Structure**: Separate namespaces for different crypto archetypes
3. **Hybrid Search**: Combine semantic similarity with metadata filtering
4. **Real-time Updates**: Instantly update mentor availability and specializations

### Pinecone Index Architecture
```typescript
// Crypto mentor profiles stored with metadata for filtering
const mentorIndex = {
  namespace: "crypto-mentors",
  vectors: [
    {
      id: "mentor_123",
      values: [0.1, 0.2, 0.3, ...], // 1536-dimensional embedding
      metadata: {
        archetype: "investor", // investor, developer, social_user
        specializations: ["defi", "trading", "portfolio_management"],
        experience_years: 5,
        location: "SF",
        availability: true,
        languages: ["english", "spanish"],
        teaching_style: "hands_on",
        success_rate: 0.92
      }
    }
  ]
};
```

### Archetype-Specific Matching Logic
```typescript
// Pinecone query strategy by archetype
const searchMentors = async (newcomerProfile: CryptoNewcomer) => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!
  });
  
  const index = pinecone.Index("crypto-mentors");
  
  // Generate embedding for user's combined profile
  const queryText = buildSearchQuery(newcomerProfile);
  const embedding = await getEmbedding(queryText);
  
  // Build metadata filters based on archetype
  const filters = buildArchetypeFilters(newcomerProfile.archetype_classification);
  
  const results = await index.query({
    vector: embedding,
    topK: 10,
    filter: filters,
    includeMetadata: true,
    namespace: `mentors-${newcomerProfile.archetype_classification.primary_archetype}`
  });
  
  return results.matches?.map(match => ({
    mentor: match.metadata,
    similarity_score: match.score,
    match_explanation: generateMatchExplanation(newcomerProfile, match.metadata)
  })) || [];
};

function buildArchetypeFilters(archetype: ArchetypeClassification) {
  const baseFilters = {
    availability: { $eq: true },
    experience_years: { $gte: 2 }
  };
  
  switch (archetype.primary_archetype) {
    case 'investor':
      return {
        ...baseFilters,
        specializations: { 
          $in: ["trading", "defi", "portfolio_management", "risk_assessment"] 
        }
      };
    case 'developer':
      return {
        ...baseFilters,
        specializations: { 
          $in: ["smart_contracts", "dapp_development", "protocol_design", "security"] 
        }
      };
    case 'social_user':
      return {
        ...baseFilters,
        specializations: { 
          $in: ["community_building", "dao_participation", "content_creation", "networking"] 
        }
      };
  }
}
```

### Crypto-Specific Scoring Components
```typescript
function calculateCryptoMatchScore(newcomer: CryptoNewcomer, mentor: CryptoMentor): CryptoMatchScore {
  const scores = {
    archetype_alignment: calculateArchetypeScore(newcomer, mentor),
    knowledge_gap_appropriateness: calculateKnowledgeGapScore(newcomer, mentor),
    learning_style_compatibility: calculateLearningStyleScore(newcomer, mentor),
    crypto_community_overlap: calculateCommunityScore(newcomer, mentor),
    availability_match: calculateAvailabilityScore(newcomer, mentor)
  };
  
  const weights = {
    archetype_alignment: 0.40,
    knowledge_gap_appropriateness: 0.25,
    learning_style_compatibility: 0.20,
    crypto_community_overlap: 0.10,
    availability_match: 0.05
  };
  
  const overall_score = Object.entries(scores)
    .reduce((total, [key, score]) => total + (score * weights[key]), 0);
  
  return {
    overall_score,
    component_scores: scores,
    explanation: generateCryptoMatchExplanation(scores, newcomer, mentor),
    learning_path_suggestion: generateLearningPath(newcomer.archetype_classification, mentor.crypto_expertise)
  };
}
```

### Pinecone RAG Integration for Context-Aware Responses
```typescript
// Retrieve relevant crypto education content for personalized responses
const getCryptoContext = async (userQuery: string, archetype: string) => {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pinecone.Index("crypto-education");
  
  const embedding = await getEmbedding(userQuery);
  
  const results = await index.query({
    vector: embedding,
    topK: 5,
    filter: {
      archetype: { $eq: archetype },
      content_type: { $in: ["beginner_guide", "tutorial", "best_practices"] }
    },
    includeMetadata: true,
    namespace: "educational-content"
  });
  
  return results.matches?.map(match => match.metadata?.content).join('\n') || '';
};
```

---

## 8. Implementation Requirements

### Core Features (MVP)
- [ ] 5-question AI agent interview system
- [ ] Structured JSON profile generation
- [ ] Weaviate mentor database integration
- [ ] Vector similarity matching
- [ ] Top 3 mentor recommendations
- [ ] Basic matching explanation

### Enhanced Features (Phase 2)
- [ ] Real-time conversation refinement
- [ ] Multi-language support
- [ ] Calendar integration
- [ ] Feedback loop for match quality
- [ ] Bulk mentor profile import
- [ ] Analytics dashboard

### Advanced Features (Phase 3)
- [ ] Group mentoring support
- [ ] AI-powered mentoring session summaries
- [ ] Continuous learning from user feedback
- [ ] Integration with HRIS systems
- [ ] Advanced matching algorithms with ML

---

## 9. API Specifications

### Core Endpoints

#### Start Mentee Interview
```
POST /api/interview/start
Body: { mentee_id: string, user_info: object }
Response: { session_id: string, first_question: string }
```

#### Submit Interview Response
```
POST /api/interview/respond
Body: { session_id: string, response: string, question_number: number }
Response: { next_question?: string, completed: boolean }
```

#### Get Mentor Matches
```
POST /api/matches/find
Body: { mentee_profile: object }
Response: { matches: mentor[], total_count: number, search_time_ms: number }
```

#### Complete Interview
```
POST /api/interview/complete
Body: { session_id: string }
Response: { profile: object, matches: mentor[] }
```

---

## 10. Quality Assurance

### Profile Data Quality
- **Completeness Validation**: Ensure all required fields are populated
- **Consistency Checks**: Standardize industry terms, experience levels
- **Semantic Coherence**: Validate that generated profiles make sense
- **Bias Detection**: Monitor for and prevent demographic bias in matching

### Matching Quality Metrics
- **Relevance Score**: Average similarity score of top 3 matches
- **User Satisfaction**: Post-match feedback ratings
- **Match Success Rate**: Percentage of matches leading to ongoing mentoring
- **Diversity Index**: Measure demographic diversity in recommendations

### Performance Requirements
- **Interview Completion**: < 5 minutes average duration
- **Profile Generation**: < 15 seconds processing time
- **Match Retrieval**: < 2 seconds for top 10 matches
- **System Uptime**: 99.9% availability target

---

## 11. Privacy & Security

### Data Protection
- **Encryption**: All profile data encrypted at rest and in transit
- **Access Control**: Role-based permissions for mentor/mentee data
- **Data Retention**: Configurable retention policies for profiles
- **GDPR Compliance**: Support for data deletion and export requests

### AI Ethics
- **Bias Mitigation**: Regular audits of matching outcomes across demographics
- **Transparency**: Explainable matching recommendations
- **Consent Management**: Clear consent for AI processing and matching
- **Human Oversight**: Ability to manually review and adjust matches

---

## 12. Success Metrics

### User Engagement
- **Interview Completion Rate**: >85% of started interviews completed
- **Profile Accuracy**: >90% user approval of generated profiles
- **Match Acceptance Rate**: >70% of recommended matches contacted
- **Return Usage**: >60% of users return for additional matching

### Business Impact
- **Time to Match**: Reduce average matching time from 2 weeks to <1 hour
- **Match Quality**: >4.0/5.0 average satisfaction rating
- **Scalability**: Support 10,000+ concurrent users
- **Cost Efficiency**: <$2 total cost per completed match

### Technical Performance
- **Response Time**: 95th percentile API response <500ms
- **Search Accuracy**: >0.8 average cosine similarity for top matches
- **System Reliability**: <0.1% error rate across all operations
- **Model Performance**: Regular A/B testing of LLM effectiveness

---

## 15. Risk Assessment & Mitigation

### Technical Risks
- **Mini App Platform Dependency**: Reliance on Farcaster and Base ecosystem stability
- **Cross-Platform Compatibility**: Ensuring consistent UX across different mini app hosts
- **Social Graph Changes**: Adapting to Farcaster protocol updates and API changes
- **Model Hallucination**: AI generating inaccurate profile information
- **Vector Database Performance**: Slow search at scale with social context enrichment

### Business Risks
- **Platform Policy Changes**: Farcaster or Coinbase policy updates affecting mini apps
- **Viral Growth Plateau**: K-factor dropping below sustainable levels
- **Social Privacy Concerns**: Users uncomfortable with social graph utilization
- **Competitive Response**: Major platforms launching competing social mentor matching
- **Regulatory Compliance**: Data privacy regulations affecting social data usage

### Mitigation Strategies
- **Multi-Platform Strategy**: Develop contingency plans for alternative distribution channels
- **Social Privacy Controls**: Granular user controls for social data sharing and visibility
- **Validation Layers**: Multiple checks for profile accuracy with social verification
- **Performance Monitoring**: Real-time alerts for system issues across all platforms
- **Community Building**: Foster strong user community independent of platform changes
- **Compliance Framework**: Proactive privacy and data protection measures

### Mini App Specific Risks
- **Manifest Security**: Ensuring cryptographic signatures remain valid
- **Frame Rendering**: Maintaining consistent UI across different client implementations
- **Webhook Reliability**: Handling notification delivery failures gracefully
- **Deep Link Management**: Ensuring URLs remain functional across platform updates

---

## Appendix A: Question Examples

### Sample AI Agent Conversations

**Question 1 - Learning Goals**
```
AI: "Hi! I'm here to help match you with the perfect mentor. Let's start with what you're hoping to achieve - what specific skills or knowledge areas would you like to develop through mentoring?"

Mentee: "I want to transition from a software engineer to a product manager role."

AI: "That's an exciting career transition! What aspects of product management are you most interested in learning about - strategy, user research, stakeholder management, or technical product decisions?"
```

**Question 2 - Current Background**
```
AI: "Tell me about your current role and experience. What's your background in tech?"

Mentee: "I've been a backend engineer for 3 years, mostly working on APIs and database design."

AI: "Great foundation! Have you had any exposure to product decisions or customer-facing work in your current role?"
```

### Profile Generation Example
Based on the conversation above, the AI would generate:
```json
{
  "learning_objectives": {
    "primary_goals": ["product_management_transition", "product_strategy", "stakeholder_management"],
    "career_stage": "mid_career",
    "timeline": "6_months"
  },
  "current_background": {
    "role": "backend_engineer",
    "experience_level": "3-5",
    "industry": "technology"
  }
}
```