/**
 * Usage examples for GolemDB Conversation Module in Next.js
 */

import { conversationManager, ConversationClient } from './index';
import type { ConversationCreateInput, ConversationEntity } from './types';

// =============================================================================
// Server-side usage (API routes, server components, middleware)
// =============================================================================

/**
 * Example: Store conversation after video call ends
 * The meetId should be provided by your application (e.g., from smart contract)
 */
export async function storeVideoCallConversation(
  meetId: string,
  walletAddress: string,
  conversationLengthMs: number,
  transcript: string
): Promise<boolean> {
  try {
    const conversationData: ConversationCreateInput = {
      meetId: meetId, // Provided by your app (transaction hash, etc.)
      conversationLength: conversationLengthMs,
      transcript: transcript,
      walletAddress: walletAddress // Stored as metadata
    };

    const result = await conversationManager.storeConversation(conversationData);
    
    if (result.success && result.data) {
      console.log('Conversation stored with meet ID:', meetId);
      return true;
    } else {
      console.error('Failed to store conversation:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error storing conversation:', error);
    return false;
  }
}

/**
 * Example: Retrieve a specific conversation by meet ID
 */
export async function getConversationByMeetId(
  meetId: string
): Promise<ConversationEntity | null> {
  try {
    const result = await conversationManager.getConversation(meetId);

    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Failed to get conversation:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error getting conversation:', error);
    return null;
  }
}

/**
 * Example: Managing meet IDs for a user
 * In production, you'd store these meet IDs in your own database/storage
 */
export class UserMeetIndex {
  private meetIds: Map<string, string[]> = new Map();

  addMeetId(walletAddress: string, meetId: string) {
    const ids = this.meetIds.get(walletAddress) || [];
    ids.push(meetId);
    this.meetIds.set(walletAddress, ids);
  }

  getMeetIds(walletAddress: string): string[] {
    return this.meetIds.get(walletAddress) || [];
  }

  async getUserConversations(walletAddress: string): Promise<ConversationEntity[]> {
    const ids = this.getMeetIds(walletAddress);
    const conversations: ConversationEntity[] = [];

    for (const id of ids) {
      const conversation = await getConversationByMeetId(id);
      if (conversation) {
        conversations.push(conversation);
      }
    }

    return conversations;
  }
}

/**
 * Example: Update conversation with additional analysis
 */
export async function updateConversationAnalysis(
  conversationId: string,
  enhancedTranscript: string
) {
  try {
    const result = await conversationManager.updateConversation(
      conversationId,
      {
        transcript: enhancedTranscript
      }
    );

    if (result.success) {
      console.log('Conversation updated:', conversationId);
      return result.data;
    } else {
      console.error('Failed to update conversation:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error updating conversation:', error);
    return null;
  }
}

// =============================================================================
// Client-side usage (React components, browser JavaScript)
// =============================================================================

/**
 * Example React hook for managing a single conversation
 */
import { useState, useEffect } from 'react';

export function useConversation(meetId: string | null) {
  const [conversation, setConversation] = useState<ConversationEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = new ConversationClient();

  const loadConversation = async () => {
    if (!meetId) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await client.getConversation(meetId);
      
      if (result.success) {
        setConversation(result.data || null);
      } else {
        setError(result.error || 'Failed to load conversation');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const storeConversation = async (data: ConversationCreateInput): Promise<boolean> => {
    try {
      const result = await client.storeConversation(data);
      
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'Failed to store conversation');
        return false;
      }
    } catch (err) {
      setError('Network error occurred');
      return false;
    }
  };

  useEffect(() => {
    loadConversation();
  }, [meetId]);

  return {
    conversation,
    loading,
    error,
    loadConversation,
    storeConversation
  };
}

/**
 * Example React component for conversation history
 */
export function ConversationHistory({ walletAddress }: { walletAddress: string }) {
  const { conversations, loading, error, storeConversation } = useConversations(walletAddress);

  if (loading) return <div>Loading conversations...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="conversation-history">
      <h2>Your Conversations</h2>
      {conversations.length === 0 ? (
        <p>No conversations found.</p>
      ) : (
        <ul>
          {conversations.map((conversation) => (
            <li key={conversation.conversationId}>
              <div>
                <strong>Date:</strong> {new Date(conversation.timestamp).toLocaleString()}
              </div>
              <div>
                <strong>Duration:</strong> {Math.round(conversation.conversationLength / 1000)}s
              </div>
              <div>
                <strong>Transcript:</strong> {conversation.transcript.substring(0, 100)}...
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =============================================================================
// Integration examples for common scenarios
// =============================================================================

/**
 * Example: Video call component integration
 */
export class VideoCallManager {
  private startTime: number | null = null;
  private transcriptBuffer: string[] = [];

  startCall() {
    this.startTime = Date.now();
    this.transcriptBuffer = [];
    console.log('Video call started');
  }

  addTranscriptSegment(text: string) {
    this.transcriptBuffer.push(text);
  }

  async endCall(meetId: string, walletAddress: string): Promise<boolean> {
    if (!this.startTime) {
      throw new Error('Call was not started');
    }

    const conversationLength = Date.now() - this.startTime;
    const transcript = this.transcriptBuffer.join(' ');

    // Store conversation in GolemDB with the provided meet ID
    const success = await storeVideoCallConversation(
      meetId,
      walletAddress,
      conversationLength,
      transcript
    );

    // Reset state
    this.startTime = null;
    this.transcriptBuffer = [];

    return success;
  }
}

/**
 * Example: Batch processing conversations
 */
export async function processConversationsBatch(
  conversations: Array<{
    walletAddress: string;
    conversationLength: number;
    transcript: string;
  }>
) {
  const results = [];
  
  for (const conversation of conversations) {
    try {
      const result = await conversationManager.storeConversation(conversation);
      results.push({ success: result.success, id: result.data?.conversationId });
    } catch (error) {
      results.push({ success: false, error: error });
    }
  }

  return results;
}

/**
 * Example: Search conversations within a list of meet IDs
 * Note: In production, you'd maintain an index of meet IDs per user
 */
export async function searchConversations(
  meetIds: string[],
  searchTerm: string
): Promise<ConversationEntity[]> {
  try {
    const conversations: ConversationEntity[] = [];
    
    // Fetch each conversation by meet ID
    for (const meetId of meetIds) {
      const result = await conversationManager.getConversation(meetId);
      if (result.success && result.data) {
        // Check if conversation matches search term
        if (result.data.transcript.toLowerCase().includes(searchTerm.toLowerCase())) {
          conversations.push(result.data);
        }
      }
    }

    return conversations;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// =============================================================================
// Environment-specific examples
// =============================================================================

/**
 * Example: Development/testing utilities
 */
export async function createMockConversation(meetId: string, walletAddress: string) {
  const mockTranscript = `
    User: Hello, can you help me understand Web3?
    Assistant: Of course! Web3 refers to the decentralized internet built on blockchain technology.
    User: What are the main benefits?
    Assistant: The main benefits include decentralization, transparency, and user ownership of data.
  `.trim();

  return storeVideoCallConversation(
    meetId,
    walletAddress,
    45000, // 45 seconds
    mockTranscript
  );
}

/**
 * Example: Generate meet ID from sender and receiver wallets
 */
export function generateMeetIdFromWallets(senderWallet: string, receiverWallet: string): string {
  // Simple implementation - in production, use a proper hash function
  const combined = `${senderWallet.toLowerCase()}_${receiverWallet.toLowerCase()}_${Date.now()}`;
  
  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `meet_${Math.abs(hash).toString(36)}_${Date.now()}`;
}

/**
 * Example: Analytics and reporting from meet IDs
 */
export async function generateConversationReport(meetIds: string[]) {
  try {
    const conversations: ConversationEntity[] = [];
    
    // Fetch each conversation by meet ID
    for (const meetId of meetIds) {
      const result = await conversationManager.getConversation(meetId);
      if (result.success && result.data) {
        conversations.push(result.data);
      }
    }
    
    if (conversations.length === 0) {
      return null;
    }

    const totalConversations = conversations.length;
    const totalDuration = conversations.reduce((sum, conv) => sum + conv.conversationLength, 0);
    const averageDuration = totalConversations > 0 ? totalDuration / totalConversations : 0;
    const averageTranscriptLength = totalConversations > 0 ? 
      conversations.reduce((sum, conv) => sum + conv.transcript.length, 0) / totalConversations : 0;

    // Sort by timestamp to find first and last
    conversations.sort((a, b) => a.timestamp - b.timestamp);

    return {
      totalConversations,
      totalDuration: Math.round(totalDuration / 1000), // in seconds
      averageDuration: Math.round(averageDuration / 1000), // in seconds
      averageTranscriptLength: Math.round(averageTranscriptLength),
      firstConversation: conversations[0]?.timestamp,
      lastConversation: conversations[conversations.length - 1]?.timestamp
    };
  } catch (error) {
    console.error('Report generation error:', error);
    return null;
  }
}