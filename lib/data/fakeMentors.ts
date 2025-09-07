import { CryptoMentorProfile } from '@/lib/types/interview';
import { v4 as uuidv4 } from 'uuid';

export const fakeMentors: CryptoMentorProfile[] = [
  // Investor Archetype Mentors
  {
    id: uuidv4(),
    created_at: new Date(),
    profile_type: 'mentor',
    personal_info: {
      fullName: 'Alex Chen',
      email: 'alex.chen@example.com',
      farcasterUsername: 'alexchen',
      fid: '1234',
      timezone: 'America/New_York',
      bio: 'Former Wall Street trader turned DeFi specialist. 8+ years in crypto, focusing on yield strategies and risk management. Built multiple successful DeFi protocols.',
    },
    crypto_expertise: {
      primary_archetype: 'investor',
      specializations: ['DeFi', 'yield farming', 'risk management', 'portfolio optimization', 'market analysis'],
      years_in_crypto: 8,
      notable_achievements: [
        'Managed $50M+ DeFi portfolio',
        'Created popular yield farming strategy guide',
        'Early investor in multiple unicorn protocols',
      ],
      current_projects: ['DeFi protocol advisor', 'Crypto fund manager'],
      blockchain_expertise: ['Ethereum', 'Arbitrum', 'Polygon', 'Base'],
    },
    mentoring_approach: {
      teaching_style: 'directive',
      teaching_focus: ['risk assessment', 'portfolio management', 'DeFi strategies', 'market analysis'],
      communication_style: 'direct',
      strengths: ['analytical thinking', 'risk management', 'strategic planning'],
      preferred_mentee_level: ['intermediate', 'advanced'],
    },
    availability: {
      is_available: true,
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      times: ['morning', 'afternoon'],
      timezone: 'America/New_York',
      preferred_format: ['video', 'text'],
      max_mentees: 5,
      current_mentees: 2,
    },
    metrics: {
      successful_mentees: 23,
      community_reputation: 9.2,
      response_time: 'same_day',
      completion_rate: 0.92,
    },
    pricing: {
      is_paid: true,
      rate_type: 'per_call',
      rate_usd: 100, // $100 per call
    },
    search_keywords: ['defi', 'investor', 'trading', 'yield', 'portfolio', 'risk'],
  },
  
  {
    id: uuidv4(),
    created_at: new Date(),
    profile_type: 'mentor',
    personal_info: {
      fullName: 'Sarah Williams',
      email: 'sarah.w@example.com',
      farcasterUsername: 'sarahcrypto',
      fid: '2345',
      timezone: 'Europe/London',
      bio: 'Crypto trading educator and market analyst. Specializing in technical analysis and trading psychology. Author of "Mastering Crypto Markets".',
    },
    crypto_expertise: {
      primary_archetype: 'investor',
      specializations: ['trading', 'technical analysis', 'market psychology', 'futures', 'options'],
      years_in_crypto: 6,
      notable_achievements: [
        'Published crypto trading book',
        '10,000+ students trained',
        'Consistent 30%+ annual returns',
      ],
      current_projects: ['Trading education platform', 'Market analysis newsletter'],
      blockchain_expertise: ['Bitcoin', 'Ethereum', 'Solana'],
    },
    mentoring_approach: {
      teaching_style: 'supportive',
      teaching_focus: ['trading fundamentals', 'technical analysis', 'risk management', 'psychology'],
      communication_style: 'supportive',
      strengths: ['patient teaching', 'clear explanations', 'practical examples'],
      preferred_mentee_level: ['beginner', 'intermediate'],
    },
    availability: {
      is_available: true,
      days: ['tuesday', 'thursday', 'saturday'],
      times: ['afternoon', 'evening'],
      timezone: 'Europe/London',
      preferred_format: ['video', 'async'],
      max_mentees: 8,
      current_mentees: 5,
    },
    metrics: {
      successful_mentees: 45,
      community_reputation: 8.8,
      response_time: 'next_day',
      completion_rate: 0.88,
    },
    search_keywords: ['trading', 'investor', 'technical analysis', 'education', 'beginner'],
  },

  // Developer Archetype Mentors
  {
    id: uuidv4(),
    created_at: new Date(),
    profile_type: 'mentor',
    personal_info: {
      fullName: 'Marcus Rodriguez',
      email: 'marcus.dev@example.com',
      farcasterUsername: 'marcusbuilds',
      fid: '3456',
      timezone: 'America/Los_Angeles',
      bio: 'Solidity expert and smart contract auditor. Founded 2 successful DeFi protocols. Passionate about secure, efficient blockchain development.',
    },
    crypto_expertise: {
      primary_archetype: 'developer',
      specializations: ['Solidity', 'smart contracts', 'security auditing', 'DeFi development', 'gas optimization'],
      years_in_crypto: 7,
      notable_achievements: [
        'Audited 100+ smart contracts',
        'Founded DeFi protocol with $100M TVL',
        'Core contributor to major Ethereum improvement',
      ],
      current_projects: ['Smart contract auditing firm', 'Open source DeFi tools'],
      blockchain_expertise: ['Ethereum', 'Base', 'Optimism', 'zkSync'],
    },
    mentoring_approach: {
      teaching_style: 'collaborative',
      teaching_focus: ['smart contract development', 'security best practices', 'testing', 'architecture'],
      communication_style: 'collaborative',
      strengths: ['code reviews', 'debugging', 'architecture design', 'security mindset'],
      preferred_mentee_level: ['intermediate', 'advanced'],
    },
    availability: {
      is_available: true,
      days: ['monday', 'wednesday', 'friday'],
      times: ['evening', 'night'],
      timezone: 'America/Los_Angeles',
      preferred_format: ['video', 'text', 'async'],
      max_mentees: 4,
      current_mentees: 3,
    },
    metrics: {
      successful_mentees: 18,
      community_reputation: 9.5,
      response_time: 'same_day',
      completion_rate: 0.95,
    },
    search_keywords: ['developer', 'solidity', 'smart contracts', 'security', 'defi', 'ethereum'],
  },

  {
    id: uuidv4(),
    created_at: new Date(),
    profile_type: 'mentor',
    personal_info: {
      fullName: 'Emily Zhang',
      email: 'emily.z@example.com',
      farcasterUsername: 'emilydev',
      fid: '4567',
      timezone: 'Asia/Singapore',
      bio: 'Full-stack blockchain developer specializing in dApp development. Built multiple consumer-facing crypto applications with millions of users.',
    },
    crypto_expertise: {
      primary_archetype: 'developer',
      specializations: ['dApp development', 'Web3 integration', 'frontend', 'UX/UI', 'React'],
      years_in_crypto: 5,
      notable_achievements: [
        'Built NFT marketplace with 1M+ users',
        'Created popular Web3 development course',
        'Speaker at major blockchain conferences',
      ],
      current_projects: ['Web3 startup CTO', 'Open source Web3 libraries'],
      blockchain_expertise: ['Ethereum', 'Polygon', 'Solana', 'Near'],
    },
    mentoring_approach: {
      teaching_style: 'coaching',
      teaching_focus: ['dApp architecture', 'Web3 UX', 'frontend integration', 'best practices'],
      communication_style: 'supportive',
      strengths: ['patient guidance', 'practical projects', 'career advice'],
      preferred_mentee_level: ['beginner', 'intermediate'],
    },
    availability: {
      is_available: true,
      days: ['tuesday', 'thursday', 'saturday', 'sunday'],
      times: ['morning', 'afternoon'],
      timezone: 'Asia/Singapore',
      preferred_format: ['video', 'async'],
      max_mentees: 6,
      current_mentees: 4,
    },
    metrics: {
      successful_mentees: 32,
      community_reputation: 8.9,
      response_time: 'next_day',
      completion_rate: 0.90,
    },
    search_keywords: ['developer', 'dapp', 'web3', 'frontend', 'react', 'beginner'],
  },

  // Social User Archetype Mentors
  {
    id: uuidv4(),
    created_at: new Date(),
    profile_type: 'mentor',
    personal_info: {
      fullName: 'Jordan Taylor',
      email: 'jordan.t@example.com',
      farcasterUsername: 'jordandao',
      fid: '5678',
      timezone: 'America/Chicago',
      bio: 'DAO governance expert and community builder. Founded and scaled multiple successful DAOs. Passionate about decentralized governance and community engagement.',
    },
    crypto_expertise: {
      primary_archetype: 'social_user',
      specializations: ['DAO governance', 'community building', 'tokenomics', 'social tokens', 'content creation'],
      years_in_crypto: 6,
      notable_achievements: [
        'Founded DAO with 10,000+ members',
        'Designed successful tokenomics models',
        'Built engaged communities across platforms',
      ],
      current_projects: ['DAO consultant', 'Community strategy advisor'],
      blockchain_expertise: ['Ethereum', 'Base', 'Arbitrum'],
    },
    mentoring_approach: {
      teaching_style: 'collaborative',
      teaching_focus: ['community strategy', 'governance design', 'engagement tactics', 'content creation'],
      communication_style: 'collaborative',
      strengths: ['strategic thinking', 'community psychology', 'creative solutions'],
      preferred_mentee_level: ['beginner', 'intermediate', 'advanced'],
    },
    availability: {
      is_available: true,
      days: ['monday', 'tuesday', 'thursday', 'friday'],
      times: ['afternoon', 'evening'],
      timezone: 'America/Chicago',
      preferred_format: ['video', 'text', 'async'],
      max_mentees: 10,
      current_mentees: 7,
    },
    metrics: {
      successful_mentees: 58,
      community_reputation: 9.1,
      response_time: 'same_day',
      completion_rate: 0.87,
    },
    search_keywords: ['social', 'dao', 'community', 'governance', 'content', 'engagement'],
  },

  {
    id: uuidv4(),
    created_at: new Date(),
    profile_type: 'mentor',
    personal_info: {
      fullName: 'Lisa Park',
      email: 'lisa.p@example.com',
      farcasterUsername: 'lisanft',
      fid: '6789',
      timezone: 'America/New_York',
      bio: 'NFT artist and Web3 marketing specialist. Helped launch 50+ successful NFT collections. Expert in crypto social media and community engagement.',
    },
    crypto_expertise: {
      primary_archetype: 'social_user',
      specializations: ['NFTs', 'digital art', 'marketing', 'social media', 'brand building'],
      years_in_crypto: 4,
      notable_achievements: [
        'Sold NFT collection for $2M+',
        'Built Twitter following of 100K+',
        'Advised top NFT projects',
      ],
      current_projects: ['NFT collection curator', 'Web3 marketing agency'],
      blockchain_expertise: ['Ethereum', 'Solana', 'Tezos'],
    },
    mentoring_approach: {
      teaching_style: 'supportive',
      teaching_focus: ['NFT creation', 'community building', 'marketing', 'brand strategy'],
      communication_style: 'supportive',
      strengths: ['creative thinking', 'trend spotting', 'networking'],
      preferred_mentee_level: ['beginner', 'intermediate'],
    },
    availability: {
      is_available: true,
      days: ['wednesday', 'friday', 'saturday', 'sunday'],
      times: ['afternoon', 'evening'],
      timezone: 'America/New_York',
      preferred_format: ['video', 'async'],
      max_mentees: 12,
      current_mentees: 8,
    },
    metrics: {
      successful_mentees: 72,
      community_reputation: 8.5,
      response_time: 'next_day',
      completion_rate: 0.85,
    },
    search_keywords: ['social', 'nft', 'art', 'marketing', 'community', 'creator'],
  },

  // Mixed/Hybrid Mentors
  {
    id: uuidv4(),
    created_at: new Date(),
    profile_type: 'mentor',
    personal_info: {
      fullName: 'David Kim',
      email: 'david.k@example.com',
      farcasterUsername: 'davidcrypto',
      fid: '7890',
      timezone: 'Asia/Seoul',
      bio: 'Blockchain architect and DeFi investor. Technical background with strong investment acumen. Bridge between development and investment worlds.',
    },
    crypto_expertise: {
      primary_archetype: 'developer',
      specializations: ['blockchain architecture', 'DeFi protocols', 'tokenomics', 'investment analysis', 'technical due diligence'],
      years_in_crypto: 9,
      notable_achievements: [
        'Architected Layer 2 solution',
        'Angel invested in 20+ projects',
        'Published blockchain research papers',
      ],
      current_projects: ['Blockchain consulting', 'Venture partner'],
      blockchain_expertise: ['Ethereum', 'Cosmos', 'Polkadot', 'Base'],
    },
    mentoring_approach: {
      teaching_style: 'directive',
      teaching_focus: ['system design', 'investment analysis', 'technical evaluation', 'protocol design'],
      communication_style: 'direct',
      strengths: ['technical depth', 'investment insight', 'strategic thinking'],
      preferred_mentee_level: ['advanced'],
    },
    availability: {
      is_available: true,
      days: ['monday', 'wednesday', 'friday'],
      times: ['morning', 'evening'],
      timezone: 'Asia/Seoul',
      preferred_format: ['video', 'text'],
      max_mentees: 3,
      current_mentees: 2,
    },
    metrics: {
      successful_mentees: 15,
      community_reputation: 9.7,
      response_time: 'same_day',
      completion_rate: 0.97,
    },
    search_keywords: ['developer', 'investor', 'architecture', 'defi', 'technical', 'advanced'],
  },
];

// Helper function to get mentors by archetype
export function getMentorsByArchetype(archetype: 'investor' | 'developer' | 'social_user'): CryptoMentorProfile[] {
  return fakeMentors.filter(mentor => mentor.crypto_expertise.primary_archetype === archetype);
}

// Helper function to get available mentors
export function getAvailableMentors(): CryptoMentorProfile[] {
  return fakeMentors.filter(mentor => mentor.availability.is_available);
}