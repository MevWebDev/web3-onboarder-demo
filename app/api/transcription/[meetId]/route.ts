import { NextRequest, NextResponse } from "next/server"
import { transcriptionService, type TranscriptionData } from "@/lib/golemdb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetId: string }> }
) {
  try {
    const { meetId } = await params
    
    const transcription = await transcriptionService.getTranscriptionByMeetId(meetId)
    
    if (!transcription) {
      return NextResponse.json(
        { error: "Transcription not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(transcription)
  } catch (error) {
    console.error("Failed to get transcription:", error)
    return NextResponse.json(
      { error: "Failed to retrieve transcription" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetId: string }> }
) {
  try {
    const { meetId } = await params
    const body = await request.json()
    
    const transcriptionData: TranscriptionData = {
      meetId,
      transcription: body.transcription,
      participants: body.participants || [],
      duration: body.duration || 0,
      timestamp: body.timestamp || new Date().toISOString(),
      callSummary: body.callSummary,
      keyInsights: body.keyInsights
    }
    
    const entityKey = await transcriptionService.storeTranscription(transcriptionData)
    
    return NextResponse.json({
      success: true,
      meetId,
      entityKey,
      message: "Transcription stored successfully"
    })
  } catch (error) {
    console.error("Failed to store transcription:", error)
    return NextResponse.json(
      { error: "Failed to store transcription" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ meetId: string }> }
) {
  try {
    const { meetId } = await params
    const { additionalBlocks } = await request.json()
    
    await transcriptionService.extendTranscriptionTTL(
      meetId, 
      additionalBlocks || 25000
    )
    
    return NextResponse.json({
      success: true,
      message: `TTL extended for transcription ${meetId}`
    })
  } catch (error) {
    console.error("Failed to extend TTL:", error)
    return NextResponse.json(
      { error: "Failed to extend transcription TTL" },
      { status: 500 }
    )
  }
}