import { NextRequest, NextResponse } from "next/server";

// In-memory storage for demo purposes
// In production, use a database
const transcriptionResults = new Map<string, any>();
const transcriptionStatus = new Map<string, string>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  const { callId } = await params;
  
  // Check if we have a result for this call
  const result = transcriptionResults.get(callId);
  const currentStatus = transcriptionStatus.get(callId) || 'waiting';
  
  if (result) {
    return NextResponse.json({
      ...result,
      status: 'complete',
      stage: 'complete'
    });
  }
  
  // Return current status with detailed stage information
  return NextResponse.json(
    { 
      status: "pending", 
      stage: currentStatus,
      message: getStatusMessage(currentStatus),
      callId 
    },
    { status: 202 }
  );
}

function getStatusMessage(stage: string): string {
  switch (stage) {
    case 'waiting':
      return 'Waiting for transcription to be ready...';
    case 'fetching':
      return 'Fetching transcript from Stream.io...';
    case 'analyzing':
      return 'AI is analyzing the conversation...';
    case 'complete':
      return 'Analysis complete!';
    case 'error':
      return 'An error occurred during processing';
    default:
      return 'Processing transcription...';
  }
}

// Export for use in webhook
export function storeTranscriptionResult(callId: string, analysis: any) {
  transcriptionResults.set(callId, {
    callId,
    analysis,
    timestamp: new Date().toISOString(),
    status: 'complete',
    stage: 'complete'
  });
  // Update status to complete
  transcriptionStatus.set(callId, 'complete');
}

export function updateTranscriptionStatus(callId: string, stage: string) {
  transcriptionStatus.set(callId, stage);
  console.log(`📊 Updated transcription status for ${callId}: ${stage}`);
}