import { NextRequest, NextResponse } from "next/server"
import { streamTranscriptionManager } from "@/lib/stream-transcription"
import { mentorshipEvaluator } from "@/lib/ai-mentorship-evaluator"
import { transcriptionService } from "@/lib/golemdb"
import { storeTranscriptionResult, updateTranscriptionStatus } from "@/app/api/transcription-result/[callId]/route"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const eventType = payload.type
    const callData = payload.call || {}
    const callId = callData.id || callData.cid
    
    console.log(`📞 Received Stream.io webhook: ${eventType} for call ${callId}`)
    
    // Handle different Stream.io call events
    switch (eventType) {
      case 'call.started':
      case 'call.live_started':
        return await handleCallStarted(callId, callData, payload)
      
      case 'call.ended':
      case 'call.session_ended':
        return await handleCallEnded(callId, callData, payload)
      
      case 'call.member_joined':
        return await handleMemberJoined(callId, payload.member)
      
      case 'call.member_left':
        return await handleMemberLeft(callId, payload.member)
      
      case 'call.transcription_ready':
        return await handleTranscriptionReady(callId, payload.transcription)
      
      case 'call.recording_ready':
        return await handleRecordingReady(callId, payload.recording)
      
      default:
        console.log(`ℹ️  Unhandled event type: ${eventType}`)
        return NextResponse.json({ message: `Event ${eventType} received but not processed` })
    }
    
  } catch (error) {
    console.error('❌ Stream webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function handleCallStarted(callId: string, callData: any, payload: any) {
  console.log(`🚀 Call started: ${callId}`)
  
  try {
    // Extract meetId if provided (from smart contract integration)
    const meetId = callData.custom?.meetId || payload.meetId
    
    // Start transcription
    await streamTranscriptionManager.startCallTranscription(callId, meetId)
    
    return NextResponse.json({
      success: true,
      message: `Transcription started for call ${callId}`,
      callId,
      meetId
    })
    
  } catch (error) {
    console.error(`Failed to start transcription for call ${callId}:`, error)
    return NextResponse.json(
      { error: `Failed to start transcription: ${error}` },
      { status: 500 }
    )
  }
}

async function handleCallEnded(callId: string, callData: any, payload: any) {
  console.log(`🛑 Call ended: ${callId}`)
  
  try {
    updateTranscriptionStatus(callId, 'fetching')
    
    // Stop transcription and get the entity key from GolemDB
    const entityKey = await streamTranscriptionManager.stopCallTranscription(callId)
    
    if (entityKey) {
      // Retrieve the transcription from GolemDB for AI analysis
      const transcriptionData = await getTranscriptionFromGolemDB(entityKey)
      
      if (transcriptionData) {
        updateTranscriptionStatus(callId, 'analyzing')
        
        // Evaluate the mentorship quality using AI
        const evaluation = await mentorshipEvaluator.evaluateTranscription(
          transcriptionData.transcription,
          transcriptionData.duration
        )
        
        // Generate mentor feedback summary
        const feedbackSummary = await mentorshipEvaluator.generateMentorFeedbackSummary(evaluation)
        
        // Update the transcription in GolemDB with AI insights
        const updatedData = {
          ...transcriptionData,
          keyInsights: [
            `Overall Score: ${evaluation.overallScore}/100`,
            `Knowledge Transfer: ${evaluation.categories.knowledgeTransfer.score}/100`,
            `Communication Clarity: ${evaluation.categories.communicationClarity.score}/100`,
            `Engagement: ${evaluation.categories.engagement.score}/100`,
            ...evaluation.keyStrengths.map(s => `Strength: ${s}`),
            ...evaluation.areasForImprovement.map(s => `Improvement: ${s}`)
          ],
          aiEvaluation: evaluation,
          mentorFeedback: feedbackSummary
        }
        
        // Store the complete analysis result
        storeTranscriptionResult(callId, {
          transcription: transcriptionData,
          evaluation,
          feedbackSummary,
          entityKey,
          completedAt: new Date().toISOString()
        })
        
        console.log(`✅ Call ${callId} analysis complete with score ${evaluation.overallScore}/100`)
        
        return NextResponse.json({
          success: true,
          message: `Call analysis completed for ${callId}`,
          callId,
          entityKey,
          overallScore: evaluation.overallScore,
          evaluation: evaluation
        })
      }
    }
    
    return NextResponse.json({
      success: false,
      message: `No transcription available for call ${callId}`
    })
    
  } catch (error) {
    console.error(`Failed to process call end for ${callId}:`, error)
    updateTranscriptionStatus(callId, 'error')
    
    return NextResponse.json(
      { error: `Failed to process call end: ${error}` },
      { status: 500 }
    )
  }
}

async function handleMemberJoined(callId: string, member: any) {
  console.log(`👥 Member joined call ${callId}: ${member.user_id}`)
  
  // Add participant to transcription service
  streamTranscriptionManager.addParticipant(callId, member.user_id)
  
  return NextResponse.json({
    success: true,
    message: `Member ${member.user_id} added to call ${callId}`
  })
}

async function handleMemberLeft(callId: string, member: any) {
  console.log(`👋 Member left call ${callId}: ${member.user_id}`)
  
  return NextResponse.json({
    success: true,
    message: `Member ${member.user_id} left call ${callId}`
  })
}

async function handleTranscriptionReady(callId: string, transcriptionData: any) {
  console.log(`📝 Transcription ready for call ${callId}`)
  
  // This event might fire before call.ended, so we store it temporarily
  // The actual processing happens in handleCallEnded
  
  return NextResponse.json({
    success: true,
    message: `Transcription ready for call ${callId}`
  })
}

async function handleRecordingReady(callId: string, recordingData: any) {
  console.log(`🎥 Recording ready for call ${callId}`)
  
  return NextResponse.json({
    success: true,
    message: `Recording ready for call ${callId}`
  })
}

// Helper function to retrieve transcription from GolemDB
async function getTranscriptionFromGolemDB(entityKey: string) {
  try {
    // This would need to be implemented in your GolemDB service
    // For now, we'll use a query to find the transcription
    const client = await transcriptionService.initialize()
    
    // You might need to modify the GolemDB service to support entity key queries
    // For now, let's use a placeholder approach
    console.log(`🔍 Retrieving transcription with entity key: ${entityKey}`)
    
    // Return null for now - you'll need to implement entity key lookup in GolemDB
    return null
    
  } catch (error) {
    console.error('Failed to retrieve transcription from GolemDB:', error)
    return null
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    message: "Stream.io call webhook endpoint is active",
    timestamp: new Date().toISOString(),
    supportedEvents: [
      'call.started',
      'call.ended', 
      'call.member_joined',
      'call.member_left',
      'call.transcription_ready',
      'call.recording_ready'
    ]
  })
}