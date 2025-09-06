/**
 * Next.js API Route for Extending Conversation Lifetime on Blockchain
 * 
 * Endpoint:
 * POST /api/conversations/[meetId]/extend - Extend conversation BTL (blocks-to-live)
 */

import { NextRequest } from 'next/server';
import { handleExtendConversationLifetime } from '../../../../golemdb/helpers';

/**
 * POST /api/conversations/[meetId]/extend
 * Extend the blockchain storage lifetime (BTL) of a conversation
 * 
 * Body:
 * {
 *   "additionalBlocks"?: number  // Optional, defaults to 30 days
 * }
 * 
 * Returns transaction hash in X-Transaction-Hash header
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { meetId: string } }
) {
  return handleExtendConversationLifetime(request, { params });
}