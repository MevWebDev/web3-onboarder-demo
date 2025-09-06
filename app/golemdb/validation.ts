/**
 * Validation utilities for GolemDB conversation data
 */

import { ConversationCreateInput, ConversationError, GolemDBError } from './types';

/**
 * Validates conversation data before storage
 */
export function validateConversationData(data: ConversationCreateInput): void {
  // Validate meetId
  if (!data.meetId || typeof data.meetId !== 'string') {
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'Valid meetId is required'
    );
  }

  if (data.meetId.length < 1 || data.meetId.length > 256) {
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'MeetId must be between 1 and 256 characters'
    );
  }

  // Validate wallet address
  if (!data.walletAddress || typeof data.walletAddress !== 'string') {
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'Valid wallet address is required'
    );
  }

  if (!isValidEthereumAddress(data.walletAddress)) {
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'Invalid Ethereum address format'
    );
  }

  // Validate conversation length
  if (typeof data.conversationLength !== 'number' || data.conversationLength < 0) {
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'Conversation length must be a non-negative number'
    );
  }

  if (data.conversationLength > 24 * 60 * 60 * 1000) { // 24 hours in milliseconds
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'Conversation length exceeds maximum allowed duration (24 hours)'
    );
  }

  // Validate transcript
  if (!data.transcript || typeof data.transcript !== 'string') {
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'Transcript is required and must be a string'
    );
  }

  if (data.transcript.length > 1000000) { // 1MB text limit
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'Transcript exceeds maximum size limit (1MB)'
    );
  }

  // Check for potentially malicious content
  if (containsSuspiciousContent(data.transcript)) {
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'Transcript contains potentially malicious content'
    );
  }
}

/**
 * Validates and sanitizes Ethereum wallet address
 */
export function sanitizeWalletAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'Wallet address must be a string'
    );
  }

  // Remove whitespace and convert to lowercase
  const sanitized = address.trim().toLowerCase();
  
  if (!isValidEthereumAddress(sanitized)) {
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      `Invalid Ethereum address format: ${address}`
    );
  }

  return sanitized;
}

/**
 * Validates Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  // Basic Ethereum address validation (0x followed by 40 hex characters)
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
}

/**
 * Checks for suspicious content in transcript
 */
function containsSuspiciousContent(transcript: string): boolean {
  // List of suspicious patterns (this is a basic implementation)
  const suspiciousPatterns = [
    /javascript:/i,
    /<script/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /window\.location/i,
    /alert\s*\(/i,
    /confirm\s*\(/i,
    /prompt\s*\(/i,
    /__proto__/i,
    /constructor/i,
    /function\s*\(/i,
    /setTimeout/i,
    /setInterval/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(transcript));
}

/**
 * Sanitizes transcript content
 */
export function sanitizeTranscript(transcript: string): string {
  // Remove potential XSS vectors
  return transcript
    .replace(/<script[^>]*>.*?<\/script>/gi, '[SCRIPT_REMOVED]')
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, 'javascript_removed:')
    .trim();
}

/**
 * Validates meet ID format
 */
export function validateMeetId(meetId: string): boolean {
  // MeetId can be a transaction hash or a hash derived from sender/receiver wallets
  // It should be a valid hex string (with or without 0x prefix) or other identifier
  if (!meetId || typeof meetId !== 'string') return false;
  if (meetId.length < 1 || meetId.length > 256) return false;
  
  // Allow alphanumeric characters, hyphens, and underscores
  const meetIdRegex = /^[a-zA-Z0-9_-]+$/;
  return meetIdRegex.test(meetId) || isValidTransactionHash(meetId);
}

/**
 * Validates if a string is a valid Ethereum transaction hash
 */
export function isValidTransactionHash(hash: string): boolean {
  // Ethereum transaction hashes are 66 characters (0x + 64 hex chars)
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
  return txHashRegex.test(hash);
}

/**
 * Validates pagination parameters
 */
export function validatePagination(limit?: number, offset?: number): void {
  if (limit !== undefined) {
    if (typeof limit !== 'number' || limit < 1 || limit > 1000) {
      throw new ConversationError(
        GolemDBError.VALIDATION_ERROR,
        'Limit must be a number between 1 and 1000'
      );
    }
  }

  if (offset !== undefined) {
    if (typeof offset !== 'number' || offset < 0) {
      throw new ConversationError(
        GolemDBError.VALIDATION_ERROR,
        'Offset must be a non-negative number'
      );
    }
  }
}

/**
 * Validates timestamp range
 */
export function validateTimestampRange(startTimestamp?: number, endTimestamp?: number): void {
  if (startTimestamp !== undefined) {
    if (typeof startTimestamp !== 'number' || startTimestamp < 0) {
      throw new ConversationError(
        GolemDBError.VALIDATION_ERROR,
        'Start timestamp must be a non-negative number'
      );
    }
  }

  if (endTimestamp !== undefined) {
    if (typeof endTimestamp !== 'number' || endTimestamp < 0) {
      throw new ConversationError(
        GolemDBError.VALIDATION_ERROR,
        'End timestamp must be a non-negative number'
      );
    }
  }

  if (startTimestamp && endTimestamp && startTimestamp >= endTimestamp) {
    throw new ConversationError(
      GolemDBError.VALIDATION_ERROR,
      'Start timestamp must be less than end timestamp'
    );
  }
}

/**
 * Rate limiting check (basic implementation)
 */
export class RateLimit {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60 * 1000 // 1 minute
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(identifier, validRequests);
    
    // Check if under limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    return true;
  }
}

// Export singleton rate limiter
export const conversationRateLimit = new RateLimit();