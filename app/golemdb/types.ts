/**
 * GOLEMDB CONVERSATION TYPES
 * 
 * This file defines all the data structures (types) we use in our conversation storage system.
 * Think of types as "blueprints" that tell TypeScript what data should look like.
 * 
 * For example: If we say a person has a "name" (string) and "age" (number),
 * TypeScript will check that we always provide both when creating a person.
 */

// Import AccountData from the GolemDB library
// This tells us how to format wallet credentials
import { AccountData } from 'golem-base-sdk';

// ============================================================================
// MAIN DATA STRUCTURES
// ============================================================================

/**
 * ConversationEntity: What a saved conversation looks like
 * 
 * This is like a "conversation record" that gets stored on the blockchain.
 * Every conversation has these 5 pieces of information:
 */
export interface ConversationEntity {
  meetId: string;              // Unique ID for this conversation (like "conv_123_456")
  conversationLength: number;  // How long the conversation lasted (in milliseconds)
  transcript: string;          // The actual text of what was said
  timestamp: number;           // When this conversation was created (Unix timestamp)
  walletAddress: string;       // The Ethereum wallet address of the user
}

/**
 * ConversationCreateInput: What you need to provide to create a new conversation
 * 
 * When someone wants to save a conversation, they must provide these 4 things:
 */
export interface ConversationCreateInput {
  meetId: string;              // Unique ID (usually from your app or smart contract)
  conversationLength: number;  // Duration in milliseconds (e.g., 45000 = 45 seconds)
  transcript: string;          // The conversation text
  walletAddress: string;       // User's Ethereum address (like "0x1234...5678")
}

/**
 * ConversationUpdateInput: What you can change about an existing conversation
 * 
 * The "?" means these fields are optional - you can update just one or both.
 * Note: You cannot change meetId, walletAddress, or timestamp - those are permanent.
 */
export interface ConversationUpdateInput {
  conversationLength?: number; // Optional: Update the duration
  transcript?: string;         // Optional: Update the conversation text
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * GolemDBConfig: Settings needed to connect to the GolemDB blockchain
 * 
 * This is like your "connection settings" - similar to Wi-Fi password and network name.
 */
export interface GolemDBConfig {
  rpcUrl: string;              // The web address to connect to GolemDB
  chainId: number;             // Which blockchain network to use (like a ZIP code)
  privateKey?: AccountData;    // Your secret key for writing to blockchain (optional)
  enableLogging?: boolean;     // Should we print debug messages? (optional)
}

// ============================================================================
// SEARCH AND FILTERING TYPES
// ============================================================================

/**
 * ConversationQuery: How to search for conversations
 * 
 * All fields are optional - you can search by any combination of these criteria.
 */
export interface ConversationQuery {
  limit?: number;              // How many results to return (default: 50)
  offset?: number;             // Skip this many results (for pagination)
  startTimestamp?: number;     // Only show conversations after this time
  endTimestamp?: number;       // Only show conversations before this time
  walletAddress?: string;      // Only show conversations from this wallet
}

/**
 * ConversationFilter: Additional ways to filter conversations
 */
export interface ConversationFilter {
  minLength?: number;          // Only show conversations longer than this (milliseconds)
  maxLength?: number;          // Only show conversations shorter than this (milliseconds)
  searchTerm?: string;         // Search for specific text in transcripts
  walletAddress?: string;      // Filter by wallet address
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * GolemDBResponse: The standard format for all API responses
 * 
 * This is like a "wrapper" around all responses from our functions.
 * It always tells you if the operation succeeded and includes the data or error message.
 * 
 * The "<T>" is a TypeScript feature called "generics" - it means "T can be any type".
 * For example: GolemDBResponse<ConversationEntity> means the data will be a conversation.
 */
export interface GolemDBResponse<T> {
  success: boolean;            // Did the operation work? (true or false)
  data?: T;                    // The actual result (only present if success = true)
  error?: string;              // Error message (only present if success = false)
  transactionHash?: string;    // Blockchain transaction ID (for write operations)
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * MeetId: A type alias for conversation IDs
 * 
 * This is just a fancy way to say "MeetId is always a string".
 * It makes the code more readable when we see "MeetId" instead of just "string".
 */
export type MeetId = string;

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * GolemDBError: All the different types of errors that can happen
 * 
 * These are like "error categories" - each one represents a different problem.
 */
export enum GolemDBError {
  NETWORK_ERROR = 'NETWORK_ERROR',           // Can't connect to blockchain
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR', // Wrong credentials
  VALIDATION_ERROR = 'VALIDATION_ERROR',     // Invalid data provided
  TRANSACTION_FAILED = 'TRANSACTION_FAILED', // Blockchain transaction failed
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',     // Conversation doesn't exist
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',  // Not enough money for gas fees
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'            // Something else went wrong
}

/**
 * ConversationError: A custom error class for our application
 * 
 * This extends the built-in JavaScript Error class to include more information.
 * It's like a "super-powered error" that tells us exactly what went wrong.
 */
export class ConversationError extends Error {
  public readonly code: GolemDBError;  // What type of error this is
  public readonly details?: any;       // Additional error information

  /**
   * Create a new ConversationError
   * 
   * @param code - The type of error (from GolemDBError enum)
   * @param message - A human-readable description of the error
   * @param details - Optional additional information about the error
   */
  constructor(code: GolemDBError, message: string, details?: any) {
    super(message);                    // Call the parent Error constructor
    this.name = 'ConversationError';   // Set the error name
    this.code = code;                  // Store the error type
    this.details = details;            // Store additional details
  }
}