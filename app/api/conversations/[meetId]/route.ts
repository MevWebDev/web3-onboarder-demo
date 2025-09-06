/**
 * Next.js API Routes for Individual Conversation Management
 * 
 * Endpoints:
 * PATCH /api/conversations/[meetId] - Update conversation
 * DELETE /api/conversations/[meetId] - Delete conversation
 */

import { NextRequest } from 'next/server';
import { 
  handleUpdateConversation, 
  handleDeleteConversation 
} from '../../../golemdb/helpers';

/**
 * PATCH /api/conversations/[meetId]
 * Update an existing conversation
 * 
 * Body:
 * {
 *   "conversationLength"?: number,
 *   "transcript"?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { meetId: string } }
) {
  return handleUpdateConversation(request, { params });
}

/**
 * DELETE /api/conversations/[meetId]
 * Delete a conversation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { meetId: string } }
) {
  return handleDeleteConversation(request, { params });
}