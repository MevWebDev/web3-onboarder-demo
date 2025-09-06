import { NextRequest, NextResponse } from "next/server";

// In-memory storage for demo purposes
// In production, use a database
const transcriptionResults = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  const { callId } = await params;
  
  // Check if we have a result for this call
  const result = transcriptionResults.get(callId);
  
  if (result) {
    return NextResponse.json(result);
  }
  
  // Return pending status if no result yet
  return NextResponse.json(
    { status: "pending", message: "Transcription analysis not yet available" },
    { status: 202 }
  );
}

// Export for use in webhook
export function storeTranscriptionResult(callId: string, analysis: any) {
  transcriptionResults.set(callId, {
    callId,
    analysis,
    timestamp: new Date().toISOString(),
  });
}