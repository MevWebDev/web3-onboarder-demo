import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { logger } from '@/lib/logger/index';

// OpenRouter configuration using official provider
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Crypto Mentor Matchmaker',
  },
});

// Log configuration status
logger.debug('OpenRouter API Key present:', !!process.env.OPENROUTER_API_KEY);
logger.debug('OpenRouter API Key length:', process.env.OPENROUTER_API_KEY?.length || 0);

// Model configurations optimized for different tasks
export const modelConfig = {
  // For conversational interview questions
  conversation: 'anthropic/claude-3.5-sonnet:beta',
  
  // For structured JSON generation
  jsonGeneration: 'openai/gpt-4o-mini',
  
  // For high-quality matching and analysis
  matching: 'openai/gpt-4o',
  
  // For quick responses and simple tasks
  fast: 'openai/gpt-3.5-turbo',
};

// Log model configuration on initialization
logger.debug('OpenRouter models configured:', modelConfig);

// Helper function to get model with fallback
export function getModel(taskType: keyof typeof modelConfig, fallback?: string) {
  const model = modelConfig[taskType] || fallback || modelConfig.fast;
  logger.debug(`Using model for ${taskType}: ${model}`);
  return openrouter(model);
}