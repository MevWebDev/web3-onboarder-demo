import { NextRequest, NextResponse } from "next/server"
import { transcriptionService, type TranscriptionData } from "@/lib/golemdb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Expected webhook payload from smart contract
    const {
      meetId,
      transcriptionText,
      participants,
      callDuration,
      contractAddress,
      blockNumber,
      transactionHash
    } = body
    
    if (!meetId || !transcriptionText) {
      return NextResponse.json(
        { error: "Missing required fields: meetId and transcriptionText" },
        { status: 400 }
      )
    }
    
    // Create transcription data structure
    const transcriptionData: TranscriptionData = {
      meetId,
      transcription: transcriptionText,
      participants: participants || [],
      duration: callDuration || 0,
      timestamp: new Date().toISOString(),
      callSummary: body.callSummary,
      keyInsights: body.keyInsights
    }
    
    // Store in GolemDB
    const entityKey = await transcriptionService.storeTranscription(transcriptionData)
    
    // Log successful storage
    console.log(`Smart contract webhook: Stored transcription for meetId ${meetId}`, {
      entityKey,
      contractAddress,
      blockNumber,
      transactionHash
    })
    
    return NextResponse.json({
      success: true,
      meetId,
      entityKey,
      message: "Transcription stored from smart contract event",
      metadata: {
        contractAddress,
        blockNumber,
        transactionHash
      }
    })
  } catch (error) {
    console.error("Smart contract webhook error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process smart contract webhook",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to verify webhook is working
export async function GET() {
  return NextResponse.json({
    message: "Smart contract webhook endpoint is active",
    timestamp: new Date().toISOString()
  })
}