/**
 * Helper functions for Next.js integration with GolemDB blockchain storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { conversationManager } from './conversationManager';
import { 
  ConversationCreateInput, 
  ConversationUpdateInput,
  ConversationQuery,
  GolemDBResponse,
  ConversationError,
  GolemDBError 
} from './types';
import { conversationRateLimit, validatePagination, validateTimestampRange } from './validation';

/**
 * Blockchain-aware error handling wrapper for API routes
 */
export function withBlockchainErrorHandling<T>(
  handler: () => Promise<GolemDBResponse<T>>
): Promise<NextResponse> {
  return handler()
    .then(response => {
      if (response.success) {
        // Include transaction hash in successful responses if available
        return NextResponse.json(response, { 
          status: 200,
          headers: response.transactionHash ? {
            'X-Transaction-Hash': response.transactionHash
          } : {}
        });
      } else {
        return NextResponse.json(response, { status: 400 });
      }
    })
    .catch(error => {
      console.error('GolemDB Blockchain API Error:', error);
      
      if (error instanceof ConversationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: getStatusCodeForBlockchainError(error.code) }
        );
      }
      
      // Handle blockchain-specific errors
      if (error.message?.includes('insufficient funds')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient funds for blockchain transaction' },
          { status: 402 }
        );
      }
      
      if (error.message?.includes('gas')) {
        return NextResponse.json(
          { success: false, error: 'Gas limit exceeded or gas price too low' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Blockchain operation failed' },
        { status: 503 }
      );
    });
}

/**
 * Rate limiting middleware for blockchain operations
 * More aggressive for write operations due to gas costs
 */
export function withBlockchainRateLimit(
  identifier: string, 
  isWriteOperation: boolean = false
): NextResponse | null {
  // Use stricter limits for write operations (blockchain transactions)
  const limit = isWriteOperation ? 10 : 100; // per minute
  const window = 60 * 1000; // 1 minute
  
  // Create a separate rate limiter for write operations
  const rateLimiter = isWriteOperation ? 
    new (require('./validation').RateLimit)(limit, window) :
    conversationRateLimit;
  
  if (!rateLimiter.isAllowed(identifier)) {
    return NextResponse.json(
      { 
        success: false, 
        error: isWriteOperation ? 
          'Blockchain transaction rate limit exceeded. Please wait before making more transactions.' :
          'API rate limit exceeded'
      },
      { status: 429 }
    );
  }
  return null;
}

/**
 * Parse request body safely
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<T | null> {
  try {
    if (request.body) {
      return await request.json() as T;
    }
  } catch (error) {
    console.warn('Failed to parse request body:', error);
  }
  return null;
}

/**
 * API route handler for storing conversations on blockchain
 */
export async function handleStoreConversation(request: NextRequest): Promise<NextResponse> {
  // More restrictive rate limiting for blockchain writes
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResponse = withBlockchainRateLimit(clientIP, true);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await parseRequestBody<ConversationCreateInput>(request);
  if (!body) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  // Validate meetId is provided (required for blockchain storage)
  if (!body.meetId) {
    return NextResponse.json(
      { success: false, error: 'meetId is required for blockchain storage' },
      { status: 400 }
    );
  }

  return withBlockchainErrorHandling(() => conversationManager.storeConversation(body));
}

/**
 * API route handler for retrieving a conversation from blockchain
 */
export async function handleGetConversation(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const meetId = url.searchParams.get('meetId');
  
  if (!meetId) {
    return NextResponse.json(
      { success: false, error: 'Meet ID is required' },
      { status: 400 }
    );
  }

  // Read operations have lighter rate limiting
  const rateLimitResponse = withBlockchainRateLimit(meetId, false);
  if (rateLimitResponse) return rateLimitResponse;

  return withBlockchainErrorHandling(() => 
    conversationManager.getConversation(meetId)
  );
}

/**
 * API route handler for querying conversations from blockchain
 */
export async function handleListConversations(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  
  // Rate limiting by IP for blockchain queries
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResponse = withBlockchainRateLimit(clientIP, false);
  if (rateLimitResponse) return rateLimitResponse;

  // Parse query parameters
  const query: Partial<ConversationQuery> = {
    limit: Math.min(parseInt(url.searchParams.get('limit') || '50'), 100), // Cap at 100 for blockchain queries
    offset: parseInt(url.searchParams.get('offset') || '0'),
    startTimestamp: url.searchParams.get('startTimestamp') ? 
      parseInt(url.searchParams.get('startTimestamp')!) : undefined,
    endTimestamp: url.searchParams.get('endTimestamp') ? 
      parseInt(url.searchParams.get('endTimestamp')!) : undefined,
    walletAddress: url.searchParams.get('walletAddress') || undefined
  };

  try {
    validatePagination(query.limit, query.offset);
    validateTimestampRange(query.startTimestamp, query.endTimestamp);
  } catch (error) {
    if (error instanceof ConversationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
  }

  return withBlockchainErrorHandling(() => 
    conversationManager.listConversations(query)
  );
}

/**
 * API route handler for updating conversations on blockchain
 */
export async function handleUpdateConversation(
  request: NextRequest,
  { params }: { params: { meetId: string } }
): Promise<NextResponse> {
  const { meetId } = params;
  
  const body = await parseRequestBody<ConversationUpdateInput>(request);
  if (!body) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  // Blockchain write operation - strict rate limiting
  const rateLimitResponse = withBlockchainRateLimit(meetId, true);
  if (rateLimitResponse) return rateLimitResponse;

  return withBlockchainErrorHandling(() => 
    conversationManager.updateConversation(meetId, body)
  );
}

/**
 * API route handler for deleting conversations from blockchain
 */
export async function handleDeleteConversation(
  request: NextRequest,
  { params }: { params: { meetId: string } }
): Promise<NextResponse> {
  const { meetId } = params;
  
  // Blockchain write operation - strict rate limiting
  const rateLimitResponse = withBlockchainRateLimit(meetId, true);
  if (rateLimitResponse) return rateLimitResponse;

  return withBlockchainErrorHandling(() => 
    conversationManager.deleteConversation(meetId)
  );
}

/**
 * API route handler for extending conversation lifetime on blockchain
 */
export async function handleExtendConversationLifetime(
  request: NextRequest,
  { params }: { params: { meetId: string } }
): Promise<NextResponse> {
  const { meetId } = params;
  
  const body = await parseRequestBody<{ additionalBlocks?: number }>(request);
  const additionalBlocks = body?.additionalBlocks;

  // Blockchain write operation - strict rate limiting  
  const rateLimitResponse = withBlockchainRateLimit(meetId, true);
  if (rateLimitResponse) return rateLimitResponse;

  return withBlockchainErrorHandling(() => 
    conversationManager.extendConversationLifetime(meetId, additionalBlocks)
  );
}

/**
 * Blockchain-aware client-side helper for browser usage
 */
export class BlockchainConversationClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/conversations') {
    this.baseUrl = baseUrl;
  }

  /**
   * Store conversation on blockchain
   */
  async storeConversation(data: ConversationCreateInput): Promise<GolemDBResponse<any>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    // Extract transaction hash from headers if available
    const transactionHash = response.headers.get('X-Transaction-Hash');
    if (transactionHash && result.success) {
      result.transactionHash = transactionHash;
    }

    return result;
  }

  /**
   * Get conversation from blockchain
   */
  async getConversation(meetId: string): Promise<GolemDBResponse<any>> {
    const response = await fetch(`${this.baseUrl}?meetId=${encodeURIComponent(meetId)}`);
    return response.json();
  }

  /**
   * Query conversations from blockchain
   */
  async listConversations(
    query: Partial<ConversationQuery> = {}
  ): Promise<GolemDBResponse<any>> {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(query)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      )
    );

    const response = await fetch(`${this.baseUrl}?${params}`);
    return response.json();
  }

  /**
   * Update conversation on blockchain
   */
  async updateConversation(
    meetId: string, 
    updates: ConversationUpdateInput
  ): Promise<GolemDBResponse<any>> {
    const response = await fetch(`${this.baseUrl}/${meetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();
    
    // Extract transaction hash from headers if available
    const transactionHash = response.headers.get('X-Transaction-Hash');
    if (transactionHash && result.success) {
      result.transactionHash = transactionHash;
    }

    return result;
  }

  /**
   * Delete conversation from blockchain
   */
  async deleteConversation(meetId: string): Promise<GolemDBResponse<any>> {
    const response = await fetch(`${this.baseUrl}/${meetId}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    
    // Extract transaction hash from headers if available
    const transactionHash = response.headers.get('X-Transaction-Hash');
    if (transactionHash && result.success) {
      result.transactionHash = transactionHash;
    }

    return result;
  }

  /**
   * Extend conversation lifetime on blockchain
   */
  async extendConversationLifetime(
    meetId: string, 
    additionalBlocks?: number
  ): Promise<GolemDBResponse<any>> {
    const response = await fetch(`${this.baseUrl}/${meetId}/extend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ additionalBlocks }),
    });

    const result = await response.json();
    
    // Extract transaction hash from headers if available
    const transactionHash = response.headers.get('X-Transaction-Hash');
    if (transactionHash && result.success) {
      result.transactionHash = transactionHash;
    }

    return result;
  }
}

// Export for backward compatibility
export const ConversationClient = BlockchainConversationClient;

/**
 * Map blockchain error codes to HTTP status codes
 */
function getStatusCodeForBlockchainError(errorCode: GolemDBError): number {
  switch (errorCode) {
    case GolemDBError.VALIDATION_ERROR:
      return 400;
    case GolemDBError.AUTHENTICATION_ERROR:
      return 401;
    case GolemDBError.ENTITY_NOT_FOUND:
      return 404;
    case GolemDBError.INSUFFICIENT_FUNDS:
      return 402; // Payment required for gas
    case GolemDBError.NETWORK_ERROR:
      return 503; // Blockchain network issues
    case GolemDBError.TRANSACTION_FAILED:
      return 503; // Blockchain transaction failed
    default:
      return 500;
  }
}