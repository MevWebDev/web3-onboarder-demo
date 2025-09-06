/**
 * GolemDB Conversation Module - Main Export
 * 
 * This module provides a complete solution for storing, retrieving, and managing
 * conversation data in GolemDB for Next.js applications.
 */

// Core exports
export { ConversationManager, conversationManager } from './conversationManager';
export { getGolemDBConfig, validateConfig, GOLEMDB_TESTNET_CONFIG } from './config';
export { 
  validateConversationData, 
  sanitizeWalletAddress, 
  sanitizeTranscript,
  isValidEthereumAddress,
  validateMeetId,
  isValidTransactionHash,
  validatePagination,
  validateTimestampRange,
  RateLimit,
  conversationRateLimit 
} from './validation';

// Type exports
export type {
  ConversationEntity,
  ConversationCreateInput,
  ConversationUpdateInput,
  ConversationQuery,
  GolemDBResponse,
  MeetId,
  ConversationFilter,
  GolemDBConfig
} from './types';

export { ConversationError, GolemDBError } from './types';

// Convenience functions for Next.js blockchain integration
export * from './helpers';

// Blockchain-specific exports
export { BlockchainConversationClient } from './helpers';

// Version
export const VERSION = '1.0.0';