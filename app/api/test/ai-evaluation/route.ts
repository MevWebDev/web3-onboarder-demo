import { NextRequest, NextResponse } from "next/server"
import { mentorshipEvaluator } from "@/lib/ai-mentorship-evaluator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcription, duration, callId, meetId } = body
    
    if (!transcription) {
      return NextResponse.json(
        { error: "Transcription is required" },
        { status: 400 }
      )
    }
    
    console.log(`🤖 Testing AI evaluation for call ${callId}`)
    
    // Evaluate the transcription
    const evaluation = await mentorshipEvaluator.evaluateTranscription(
      transcription,
      duration || 120
    )
    
    // Generate feedback summary
    const feedbackSummary = await mentorshipEvaluator.generateMentorFeedbackSummary(evaluation)
    
    return NextResponse.json({
      success: true,
      callId,
      meetId,
      evaluation,
      feedbackSummary,
      message: "AI evaluation completed successfully"
    })
    
  } catch (error: any) {
    console.error("❌ AI evaluation test failed:", error)
    return NextResponse.json(
      { 
        error: "Failed to evaluate transcription",
        details: error.message
      },
      { status: 500 }
    )
  }
}