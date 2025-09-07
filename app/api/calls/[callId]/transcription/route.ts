import { NextRequest, NextResponse } from "next/server"
import { streamTranscriptionManager } from "@/lib/stream-transcription"
import { mentorshipEvaluator } from "@/lib/ai-mentorship-evaluator"

// Start transcription for a call
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const body = await request.json()
    const meetId = body.meetId
    
    console.log(`🎯 Manual start transcription request for call ${callId}`)
    
    await streamTranscriptionManager.startCallTranscription(callId, meetId)
    
    return NextResponse.json({
      success: true,
      message: `Transcription started for call ${callId}`,
      callId,
      meetId,
      status: 'recording'
    })
    
  } catch (error: any) {
    console.error(`Failed to start transcription:`, error)
    return NextResponse.json(
      { error: `Failed to start transcription: ${error.message}` },
      { status: 500 }
    )
  }
}

// Stop transcription for a call
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    
    console.log(`🛑 Manual stop transcription request for call ${callId}`)
    
    const entityKey = await streamTranscriptionManager.stopCallTranscription(callId)
    
    if (entityKey) {
      return NextResponse.json({
        success: true,
        message: `Transcription stopped and stored for call ${callId}`,
        callId,
        entityKey,
        status: 'completed'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `No transcription found for call ${callId}`,
        callId,
        status: 'not_found'
      })
    }
    
  } catch (error: any) {
    console.error(`Failed to stop transcription:`, error)
    return NextResponse.json(
      { error: `Failed to stop transcription: ${error.message}` },
      { status: 500 }
    )
  }
}

// Get transcription status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    
    const status = streamTranscriptionManager.getTranscriptionStatus(callId)
    
    if (status) {
      return NextResponse.json({
        success: true,
        callId,
        status: {
          isRecording: status.isRecording,
          isTranscribing: status.isTranscribing,
          participants: status.participants,
          startTime: status.startTime,
          endTime: status.endTime,
          meetId: status.meetId
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `No active transcription found for call ${callId}`,
        callId
      })
    }
    
  } catch (error: any) {
    console.error(`Failed to get transcription status:`, error)
    return NextResponse.json(
      { error: `Failed to get transcription status: ${error.message}` },
      { status: 500 }
    )
  }
}