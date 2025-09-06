/**
 * Next.js API Routes for GolemDB Conversation Management
 * 
 * Endpoints:
 * POST /api/conversations - Store new conversation
 * GET /api/conversations?meetId=... - Get conversation by meet ID
 * GET /api/conversations - List conversations (if indexing is implemented)
 */

import { NextRequest } from 'next/server';
import { 
  handleStoreConversation, 
  handleGetConversation,
  handleListConversations 
} from '../../golemdb/helpers';

/**
 * POST /api/conversations
 * Store a new conversation in GolemDB
 * 
 * Body:
 * {
 *   "meetId": string,
 *   "conversationLength": number,
 *   "transcript": string,
 *   "walletAddress": string
 * }
 */
export async function POST(request: NextRequest) {
  return handleStoreConversation(request);
}

/**
 * GET /api/conversations?meetId=...
 * Retrieve a specific conversation by meet ID
 * 
 * Query parameters:
 * - meetId: string (to get specific conversation)
 * - limit: number (optional, for list operation)
 * - offset: number (optional, for list operation)
 * - startTimestamp: number (optional, for filtering)
 * - endTimestamp: number (optional, for filtering)
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const meetId = url.searchParams.get('meetId');
  
  if (meetId) {
    // Get specific conversation by meet ID
    return handleGetConversation(request);
  } else {
    // List conversations (requires additional indexing implementation)
    return handleListConversations(request);
  }
}