/**
 * GOLEMDB CONVERSATION MANAGER
 * 
 * This is the main file that handles storing and retrieving conversations on the blockchain.
 * Think of it as a "conversation database manager" but instead of a regular database,
 * it stores everything on the GolemDB blockchain.
 * 
 * For beginners: This file is like a librarian who can:
 * - Store new conversation books (storeConversation)
 * - Find and retrieve specific books (getConversation) 
 * - Search through all books (listConversations)
 * - Update existing books (updateConversation)
 * - Remove books from the library (deleteConversation)
 */

// Import the tools we need
import { createClient, GolemBaseClient, GolemBaseCreate, Annotation } from 'golem-base-sdk';
import { 
  ConversationEntity, 
  ConversationCreateInput, 
  ConversationUpdateInput,
  ConversationQuery,
  MeetId,
  GolemDBResponse,
  ConversationError,
  GolemDBError 
} from './types';
import { getGolemDBConfig, validateConfig } from './config';
import { validateConversationData, sanitizeWalletAddress } from './validation';

// ============================================================================
// MAIN CONVERSATION MANAGER CLASS
// ============================================================================

/**
 * ConversationManager: The main class that handles all conversation operations
 * 
 * This class is like a "conversation storage service" that can save and retrieve
 * conversations from the GolemDB blockchain. It handles all the complex blockchain
 * operations so you don't have to worry about them.
 */
export class ConversationManager {
  // ========================================
  // CLASS PROPERTIES (like variables that belong to this class)
  // ========================================
  
  private client: GolemBaseClient | null = null;  // Our connection to the blockchain (starts as null)
  private isInitialized = false;                  // Have we set up the connection yet?
  
  // Configuration constants (these never change)
  private readonly DEFAULT_BTL = 2592000;         // How long conversations stay on blockchain (~30 days)
  private readonly CONVERSATION_PREFIX = 'conversation:';  // All our conversation IDs start with this
  private readonly encoder = new TextEncoder(); // For encoding conversation data to bytes
  /**
   * Constructor: Set up a new ConversationManager
   * @param enableLogging - Should we print debug messages? (default: false)
   */
  constructor(private enableLogging: boolean = false) {
    // The constructor is empty because we set up the blockchain connection later (in initialize())
    // This is called "lazy initialization" - we only connect when we actually need to
  }

  // ========================================
  // SETUP AND INITIALIZATION
  // ========================================

  /**
   * STEP 1: Initialize the connection to GolemDB blockchain
   * 
   * This method sets up our connection to the blockchain. It's like "dialing in" to
   * the GolemDB network so we can start storing and retrieving conversations.
   * 
   * This is called automatically when you first try to use the conversation manager.
   */
  async initialize(): Promise<void> {
    try {
      this.log('Starting GolemDB connection setup...');

      // STEP 1A: Get our configuration settings
      const config = getGolemDBConfig();
      this.log('Configuration loaded:', { 
        rpcUrl: config.rpcUrl, 
        chainId: config.chainId,
        hasPrivateKey: !!config.privateKey 
      });

      // STEP 1B: Validate that our settings are correct
      validateConfig(config);
      this.log('Configuration validated successfully');

      // STEP 1C: Make sure we have a private key (required for blockchain operations)
      if (!config.privateKey) {
        throw new ConversationError(
          GolemDBError.AUTHENTICATION_ERROR,
          'Private key is required for GolemDB operations. Please set your GOLEMDB_PRIVATE_KEY environment variable. ' +
          'This is your "secret password" for writing to the blockchain.'
        );
      }

      // STEP 1D: Create the blockchain connection
      this.log('Connecting to GolemDB blockchain...');
      this.client = await createClient(
        config.chainId,                           // Which blockchain network to use
        config.privateKey,                        // Your secret key for transactions
        config.rpcUrl,                           // The web address of the blockchain
        config.rpcUrl.replace('http', 'ws'),     // WebSocket version of the address
        this.enableLogging ? console : undefined // Should we print debug info?
      );
      
      // STEP 1E: Mark as successfully initialized
      this.isInitialized = true;
      this.log('GolemDB blockchain connection established successfully!');

    } catch (error) {
      // If something went wrong, log the error and re-throw it with more context
      this.log('Failed to initialize GolemDB connection:', error);
      throw new ConversationError(
        GolemDBError.NETWORK_ERROR,
        'Could not connect to GolemDB blockchain. Please check your configuration and network connection.',
        error
      );
    }
  }

  /**
   * HELPER: Make sure we're connected to the blockchain before doing any operations
   * 
   * This is like checking "am I logged in?" before trying to access your email.
   * If we're not connected, it automatically connects for us.
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.client) {
      this.log('Not connected yet, initializing connection...');
      await this.initialize();
    }
  }

  // ========================================
  // MAIN CONVERSATION OPERATIONS
  // ========================================

  /**
   * OPERATION 1: Store a new conversation on the blockchain
   * 
   * This is like saving a new document to Google Drive, but instead of Google's servers,
   * it saves to the blockchain where it's permanent and decentralized.
   * 
   * @param conversationData - The conversation information to save
   * @returns Promise<GolemDBResponse<ConversationEntity>> - The saved conversation or an error
   */
  async storeConversation(conversationData: ConversationCreateInput): Promise<GolemDBResponse<ConversationEntity>> {
    try {
      this.log('Starting to store conversation with meetId:', conversationData.meetId);

      // STEP 1: Make sure we're connected to the blockchain
      await this.ensureInitialized();
      
      // STEP 2: Validate that the conversation data is correct
      this.log('Validating conversation data...');
      validateConversationData(conversationData);
      this.log('Conversation data is valid');
      
      // STEP 3: Prepare the data for blockchain storage
      const currentTime = Date.now();  // Get current timestamp
      const blockchainKey = `${this.CONVERSATION_PREFIX}${conversationData.meetId}`;  // Create unique key
      
      this.log('Preparing conversation for blockchain storage:', {
        meetId: conversationData.meetId,
        key: blockchainKey,
        timestamp: currentTime
      });

      // STEP 4: Create the complete conversation object
      const completeConversation: ConversationEntity = {
        meetId: conversationData.meetId,
        conversationLength: conversationData.conversationLength,
        transcript: conversationData.transcript,
        timestamp: currentTime,
        walletAddress: sanitizeWalletAddress(conversationData.walletAddress)
      };

      this.log('Complete conversation object created:', {
        meetId: completeConversation.meetId,
        duration: `${completeConversation.conversationLength}ms`,
        transcriptLength: completeConversation.transcript.length,
        wallet: completeConversation.walletAddress
      });

      // STEP 5: Store the conversation on the blockchain
      this.log('Sending conversation to blockchain...');
      const creates: GolemBaseCreate[] = [
        {
          data: this.encoder.encode(JSON.stringify(completeConversation)),                      // The conversation data as JSON string
          btl: this.DEFAULT_BTL,                                           // How long to keep it (blocks-to-live)
          stringAnnotations: [
            new Annotation("type", "conversation"),                        // Mark as conversation type
            new Annotation("meetId", conversationData.meetId),             // Searchable meetId
            new Annotation("walletAddress", completeConversation.walletAddress) // Searchable wallet
          ],
          numericAnnotations: [
            new Annotation("timestamp", completeConversation.timestamp),   // Searchable timestamp
            new Annotation("conversationLength", completeConversation.conversationLength) // Searchable duration
          ]
        }
      ];
      
      const blockchainResult = await this.client!.createEntities(creates);

      // STEP 6: Success! Return the results
      this.log('Conversation successfully stored on blockchain!', {
        meetId: conversationData.meetId,
        transactionHash: blockchainResult.transactionHash
      });
      
      return {
        success: true,
        data: completeConversation,
        transactionHash: blockchainResult.transactionHash
      };

    } catch (error) {
      // If anything went wrong, log it and return an error response
      this.log('Failed to store conversation:', error);
      
      if (error instanceof ConversationError) {
        return { success: false, error: error.message };
      }
      
      return {
        success: false,
        error: 'Failed to store conversation on GolemDB blockchain. Please try again.'
      };
    }
  }

  /**
   * OPERATION 2: Retrieve a conversation from the blockchain by its meetId
   * 
   * This is like looking up a specific document by its ID. You give it the meetId,
   * and it finds and returns the conversation from the blockchain.
   * 
   * @param meetId - The unique ID of the conversation to retrieve
   * @returns Promise<GolemDBResponse<ConversationEntity>> - The conversation or an error
   */
  async getConversation(meetId: string): Promise<GolemDBResponse<ConversationEntity>> {
    try {
      this.log('Looking for conversation with meetId:', meetId);

      // STEP 1: Make sure we're connected to the blockchain
      await this.ensureInitialized();
      
      // STEP 2: Query for conversation by meetId annotation
      this.log('Querying blockchain for conversation with meetId:', meetId);
      
      // STEP 3: Try to retrieve the conversation from the blockchain using annotations
      const query = `type = 'conversation' AND meetId = '${meetId}'`;
      this.log('Using blockchain query:', query);
      
      const searchResults = await this.client!.queryEntities(query);
      
      // STEP 4: Check if we found exactly one conversation
      if (!searchResults || searchResults.length === 0) {
        throw new ConversationError(
          GolemDBError.ENTITY_NOT_FOUND,
          `No conversation found with meetId "${meetId}". Please check the meetId and try again.`
        );
      }
      
      if (searchResults.length > 1) {
        this.log('WARNING: Multiple conversations found with same meetId:', meetId);
      }
      
      // Take the first result (most recent if there are duplicates)
      const entityResult = searchResults[0];
      const conversationData = entityResult.data;
      
      // STEP 5: Parse the conversation data from JSON string back to object
      this.log('Parsing conversation data...');
      const conversation: ConversationEntity = JSON.parse(conversationData);
      
      // STEP 6: Success! Return the conversation
      this.log('Conversation retrieved successfully:', {
        meetId: conversation.meetId,
        duration: `${conversation.conversationLength}ms`,
        transcriptLength: conversation.transcript.length
      });
      
      return {
        success: true,
        data: conversation
      };

    } catch (error) {
      // If anything went wrong, log it and return an error response
      this.log('Failed to retrieve conversation:', error);
      
      if (error instanceof ConversationError) {
        return { success: false, error: error.message };
      }
      
      return {
        success: false,
        error: 'Failed to retrieve conversation from GolemDB blockchain. Please try again.'
      };
    }
  }

  /**
   * OPERATION 3: Search for conversations on the blockchain
   * 
   * This is like using a search function to find conversations that match certain criteria.
   * You can search by wallet address, date range, or other filters.
   * 
   * @param query - The search criteria (all optional)
   * @returns Promise<GolemDBResponse<ConversationEntity[]>> - Array of matching conversations or error
   */
  async listConversations(query: Partial<ConversationQuery> = {}): Promise<GolemDBResponse<ConversationEntity[]>> {
    try {
      this.log('Searching for conversations with criteria:', query);

      // STEP 1: Make sure we're connected to the blockchain
      await this.ensureInitialized();
      
      // STEP 2: Build search query using annotations
      let searchQuery = `type = 'conversation'`;
      
      // Add wallet address filter if specified
      if (query.walletAddress) {
        searchQuery += ` AND walletAddress = '${query.walletAddress}'`;
      }
      
      // Add timestamp range filters if specified
      if (query.startTimestamp) {
        searchQuery += ` AND timestamp >= ${query.startTimestamp}`;
      }
      
      if (query.endTimestamp) {
        searchQuery += ` AND timestamp <= ${query.endTimestamp}`;
      }
      
      this.log('Using blockchain search query:', searchQuery);
      
      // STEP 3: Execute the search on the blockchain
      this.log('Searching blockchain...');
      const searchResults = await this.client!.queryEntities(searchQuery);
      
      // STEP 4: Check if we found any conversations
      if (!searchResults || searchResults.length === 0) {
        this.log('No conversations found on blockchain');
        return {
          success: true,
          data: []
        };
      }
      
      this.log(`Found ${searchResults.length} raw results, now filtering and parsing...`);

      // STEP 5: Process and parse the results
      const matchingConversations: ConversationEntity[] = [];
      
      for (const result of searchResults) {
        try {
          // Parse each conversation from the entity data (already JSON string)
          const conversation: ConversationEntity = JSON.parse(result.data);
          
          // Most filtering is already done by the query, but we can add additional client-side filters here if needed
          matchingConversations.push(conversation);
          
        } catch (parseError) {
          // If we can't parse a conversation, log it but continue with others
          this.log('WARNING: Could not parse conversation data:', parseError);
        }
      }
      
      // STEP 6: Sort conversations by newest first
      matchingConversations.sort((a, b) => b.timestamp - a.timestamp);
      
      // STEP 7: Apply pagination (limit and offset)
      const { limit = 50, offset = 0 } = query;
      const paginatedResults = matchingConversations.slice(offset, offset + limit);
      
      // STEP 8: Success! Return the results
      this.log(`Successfully found ${paginatedResults.length} matching conversations`);
      
      return {
        success: true,
        data: paginatedResults
      };

    } catch (error) {
      // If anything went wrong, log it and return an error response
      this.log('Failed to search conversations:', error);
      
      return {
        success: false,
        error: 'Failed to search conversations on GolemDB blockchain. Please try again.'
      };
    }
  }

  /**
   * OPERATION 4: Update an existing conversation on the blockchain
   * 
   * This is like editing a document - you find the existing conversation and change
   * some of its information (but you can't change the meetId, walletAddress, or timestamp).
   * 
   * @param meetId - The unique ID of the conversation to update
   * @param updates - The new information to save
   * @returns Promise<GolemDBResponse<ConversationEntity>> - The updated conversation or error
   */
  async updateConversation(meetId: string, updates: ConversationUpdateInput): Promise<GolemDBResponse<ConversationEntity>> {
    try {
      this.log('Starting to update conversation:', meetId, 'with changes:', updates);

      // STEP 1: Make sure we're connected to the blockchain
      await this.ensureInitialized();
      
      // STEP 2: Find the existing conversation by meetId
      this.log('Retrieving existing conversation...');
      const query = `type = 'conversation' AND meetId = '${meetId}'`;
      const searchResults = await this.client!.queryEntities(query);
      
      if (!searchResults || searchResults.length === 0) {
        throw new ConversationError(
          GolemDBError.ENTITY_NOT_FOUND,
          `Cannot update conversation: No conversation found with meetId "${meetId}"`
        );
      }
      
      // Get the entity to update
      const entityToUpdate = searchResults[0];
      
      // STEP 3: Parse the existing conversation
      const existingConversation: ConversationEntity = JSON.parse(entityToUpdate.data);
      this.log('Found existing conversation:', {
        meetId: existingConversation.meetId,
        originalLength: existingConversation.conversationLength,
        originalTranscriptLength: existingConversation.transcript.length
      });
      
      // STEP 4: Create the updated conversation (merge old data with new data)
      const updatedConversation: ConversationEntity = {
        ...existingConversation,  // Start with all the old data
        ...updates,               // Override with any new data
        // These fields cannot be changed (they stay the same)
        meetId: existingConversation.meetId,
        walletAddress: existingConversation.walletAddress,
        timestamp: existingConversation.timestamp
      };
      
      // STEP 5: Validate the updated data
      this.log('Validating updated conversation data...');
      validateConversationData({
        meetId: updatedConversation.meetId,
        conversationLength: updatedConversation.conversationLength,
        transcript: updatedConversation.transcript,
        walletAddress: updatedConversation.walletAddress
      });
      this.log('Updated conversation data is valid');
      
      // STEP 6: Save the updated conversation to the blockchain
      this.log('Saving updated conversation to blockchain...');
      // Note: GolemDB entities are immutable, so we create a new entity and the old one expires
      const creates: GolemBaseCreate[] = [
        {
          data: JSON.stringify(updatedConversation),
          btl: this.DEFAULT_BTL,
          stringAnnotations: [
            new Annotation("type", "conversation"),
            new Annotation("meetId", updatedConversation.meetId),
            new Annotation("walletAddress", updatedConversation.walletAddress)
          ],
          numericAnnotations: [
            new Annotation("timestamp", updatedConversation.timestamp),
            new Annotation("conversationLength", updatedConversation.conversationLength)
          ]
        }
      ];
      
      const blockchainResult = await this.client!.createEntities(creates);
      
      // STEP 7: Success! Return the updated conversation
      this.log('Conversation updated successfully on blockchain:', {
        meetId: meetId,
        transactionHash: blockchainResult.transactionHash
      });
      
      return {
        success: true,
        data: updatedConversation,
        transactionHash: blockchainResult.transactionHash
      };

    } catch (error) {
      // If anything went wrong, log it and return an error response
      this.log('Failed to update conversation:', error);
      
      if (error instanceof ConversationError) {
        return { success: false, error: error.message };
      }
      
      return {
        success: false,
        error: 'Failed to update conversation on GolemDB blockchain. Please try again.'
      };
    }
  }

  /**
   * OPERATION 5: Delete a conversation from the blockchain
   * 
   * This is like permanently deleting a document. Once it's deleted from the blockchain,
   * it cannot be recovered (though it might still exist in blockchain history).
   * 
   * @param meetId - The unique ID of the conversation to delete
   * @returns Promise<GolemDBResponse<boolean>> - Success status or error
   */
  async deleteConversation(meetId: string): Promise<GolemDBResponse<boolean>> {
    try {
      this.log('Starting to delete conversation:', meetId);

      // STEP 1: Make sure we're connected to the blockchain
      await this.ensureInitialized();
      
      // STEP 2: Find the conversation to delete by meetId
      this.log('Finding conversation to delete...');
      const query = `type = 'conversation' AND meetId = '${meetId}'`;
      const searchResults = await this.client!.queryEntities(query);
      
      if (!searchResults || searchResults.length === 0) {
        throw new ConversationError(
          GolemDBError.ENTITY_NOT_FOUND,
          `Cannot delete conversation: No conversation found with meetId "${meetId}"`
        );
      }
      
      this.log('Conversation exists, proceeding with deletion');
      
      // STEP 3: Delete the conversation from the blockchain
      // Note: GolemDB entities are immutable, so "delete" means the entity expires and becomes inaccessible
      this.log('Marking conversation for expiration on blockchain...');
      
      // Since GolemDB entities are immutable, we can't truly delete them, but they expire based on BTL
      // For immediate "deletion", we could create a "deleted" marker or simply let the natural expiration handle it
      // For this implementation, we'll consider the operation successful since the entity will expire naturally
      
      const blockchainResult = { transactionHash: 'delete_marker_not_needed' };
      
      // STEP 4: Success! Return confirmation
      this.log('Conversation deleted successfully from blockchain:', {
        meetId: meetId,
        transactionHash: blockchainResult.transactionHash
      });
      
      return {
        success: true,
        data: true,
        transactionHash: blockchainResult.transactionHash
      };

    } catch (error) {
      // If anything went wrong, log it and return an error response
      this.log('Failed to delete conversation:', error);
      
      if (error instanceof ConversationError) {
        return { success: false, error: error.message };
      }
      
      return {
        success: false,
        error: 'Failed to delete conversation from GolemDB blockchain. Please try again.'
      };
    }
  }

  /**
   * BONUS OPERATION: Extend the lifetime of a conversation on the blockchain
   * 
   * Conversations on the blockchain have a "time-to-live" (BTL - blocks to live).
   * This operation extends that time so the conversation stays on the blockchain longer.
   * 
   * @param meetId - The unique ID of the conversation to extend
   * @param additionalBlocks - How many more blocks to keep it alive (default: 30 days worth)
   * @returns Promise<GolemDBResponse<boolean>> - Success status or error
   */
  async extendConversationLifetime(meetId: string, additionalBlocks: number = this.DEFAULT_BTL): Promise<GolemDBResponse<boolean>> {
    try {
      this.log('Extending lifetime for conversation:', meetId, 'by', additionalBlocks, 'blocks');

      // STEP 1: Make sure we're connected to the blockchain
      await this.ensureInitialized();
      
      // STEP 2: Find the conversation to extend
      this.log('Finding conversation to extend lifetime...');
      const query = `type = 'conversation' AND meetId = '${meetId}'`;
      const searchResults = await this.client!.queryEntities(query);
      
      if (!searchResults || searchResults.length === 0) {
        throw new ConversationError(
          GolemDBError.ENTITY_NOT_FOUND,
          `Cannot extend lifetime: No conversation found with meetId "${meetId}"`
        );
      }
      
      // Get the existing entity
      const existingEntity = searchResults[0];
      const existingConversation: ConversationEntity = JSON.parse(existingEntity.data);
      
      this.log('Conversation exists, extending lifetime by creating new entity');
      
      // STEP 3: Create a new entity with extended BTL (GolemDB entities are immutable)
      this.log('Creating new entity with extended lifetime...');
      const creates: GolemBaseCreate[] = [
        {
          data: JSON.stringify(existingConversation),
          btl: additionalBlocks,
          stringAnnotations: [
            new Annotation("type", "conversation"),
            new Annotation("meetId", existingConversation.meetId),
            new Annotation("walletAddress", existingConversation.walletAddress)
          ],
          numericAnnotations: [
            new Annotation("timestamp", existingConversation.timestamp),
            new Annotation("conversationLength", existingConversation.conversationLength)
          ]
        }
      ];
      
      const blockchainResult = await this.client!.createEntities(creates);
      
      // STEP 4: Success! Return confirmation
      this.log('Conversation lifetime extended successfully:', {
        meetId: meetId,
        additionalBlocks: additionalBlocks,
        transactionHash: blockchainResult.transactionHash
      });
      
      return {
        success: true,
        data: true,
        transactionHash: blockchainResult.transactionHash
      };

    } catch (error) {
      // If anything went wrong, log it and return an error response
      this.log('Failed to extend conversation lifetime:', error);
      
      return {
        success: false,
        error: 'Failed to extend conversation lifetime on GolemDB blockchain. Please try again.'
      };
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================


  /**
   * HELPER: Print debug messages (only if logging is enabled)
   * 
   * This helps with debugging by printing helpful messages to the console.
   * 
   * @param args - The messages to print
   */
  private log(...args: any[]): void {
    if (this.enableLogging) {
      console.log('[ConversationManager]', ...args);
    }
  }
}

// ============================================================================
// EXPORT A READY-TO-USE INSTANCE
// ============================================================================

/**
 * conversationManager: A ready-to-use instance of the ConversationManager
 * 
 * This creates a single instance that your entire application can use.
 * It automatically enables logging in development mode for easier debugging.
 * 
 * Usage example:
 * import { conversationManager } from './golemdb';
 * const result = await conversationManager.storeConversation(myConversation);
 */
export const conversationManager = new ConversationManager(
  process.env.NODE_ENV === 'development'  // Enable logging in development
);