import { StreamVideo } from '@stream-io/node-sdk'
import { transcriptionService, type TranscriptionData } from './golemdb'
import { updateTranscriptionStatus } from '@/app/api/transcription-result/[callId]/route'

const streamVideo = new StreamVideo({
  apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
  secret: process.env.STREAM_SECRET_KEY!,
})

export interface CallTranscriptionService {
  callId: string
  meetId?: string
  isRecording: boolean
  isTranscribing: boolean
  participants: string[]
  startTime: Date
  endTime?: Date
}

class StreamTranscriptionManager {
  private activeTranscriptions = new Map<string, CallTranscriptionService>()

  async startCallTranscription(callId: string, meetId?: string): Promise<void> {
    console.log(`🎯 Starting transcription for call ${callId}`)
    
    try {
      updateTranscriptionStatus(callId, 'fetching')
      
      // Initialize transcription service for this call
      const transcriptionService: CallTranscriptionService = {
        callId,
        meetId,
        isRecording: false,
        isTranscribing: false,
        participants: [],
        startTime: new Date()
      }
      
      this.activeTranscriptions.set(callId, transcriptionService)
      
      // Start recording the call (prerequisite for transcription)
      await this.startRecording(callId)
      
      // Start transcription
      await this.enableTranscription(callId)
      
      console.log(`✅ Transcription started for call ${callId}`)
      updateTranscriptionStatus(callId, 'analyzing')
      
    } catch (error) {
      console.error(`❌ Failed to start transcription for ${callId}:`, error)
      updateTranscriptionStatus(callId, 'error')
      throw error
    }
  }

  async stopCallTranscription(callId: string): Promise<string | null> {
    console.log(`🛑 Stopping transcription for call ${callId}`)
    
    try {
      const service = this.activeTranscriptions.get(callId)
      if (!service) {
        console.log(`⚠️ No active transcription found for call ${callId}`)
        return null
      }

      service.endTime = new Date()
      updateTranscriptionStatus(callId, 'fetching')

      // Stop recording and transcription
      await this.stopRecording(callId)
      await this.disableTranscription(callId)

      // Wait a moment for transcription to be processed
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Fetch the complete transcription
      const transcription = await this.fetchTranscription(callId)
      
      if (transcription) {
        // Store in GolemDB
        const meetId = service.meetId || `call-${callId}-${Date.now()}`
        const entityKey = await this.storeTranscriptionInGolemDB(transcription, meetId, service)
        
        console.log(`✅ Transcription stored in GolemDB with entity key: ${entityKey}`)
        updateTranscriptionStatus(callId, 'complete')
        
        // Clean up
        this.activeTranscriptions.delete(callId)
        
        return entityKey
      }
      
      return null
      
    } catch (error) {
      console.error(`❌ Failed to stop transcription for ${callId}:`, error)
      updateTranscriptionStatus(callId, 'error')
      throw error
    }
  }

  private async startRecording(callId: string): Promise<void> {
    try {
      const call = streamVideo.call('default', callId)
      await call.startRecording()
      
      const service = this.activeTranscriptions.get(callId)
      if (service) {
        service.isRecording = true
      }
      
      console.log(`🔴 Recording started for call ${callId}`)
    } catch (error) {
      console.error(`Failed to start recording for ${callId}:`, error)
      throw error
    }
  }

  private async stopRecording(callId: string): Promise<void> {
    try {
      const call = streamVideo.call('default', callId)
      await call.stopRecording()
      
      const service = this.activeTranscriptions.get(callId)
      if (service) {
        service.isRecording = false
      }
      
      console.log(`⏹️ Recording stopped for call ${callId}`)
    } catch (error) {
      console.error(`Failed to stop recording for ${callId}:`, error)
      // Don't throw - recording might already be stopped
    }
  }

  private async enableTranscription(callId: string): Promise<void> {
    try {
      const call = streamVideo.call('default', callId)
      
      // Enable transcription for the call
      await call.startTranscription()
      
      const service = this.activeTranscriptions.get(callId)
      if (service) {
        service.isTranscribing = true
      }
      
      console.log(`📝 Transcription enabled for call ${callId}`)
    } catch (error) {
      console.error(`Failed to enable transcription for ${callId}:`, error)
      throw error
    }
  }

  private async disableTranscription(callId: string): Promise<void> {
    try {
      const call = streamVideo.call('default', callId)
      await call.stopTranscription()
      
      const service = this.activeTranscriptions.get(callId)
      if (service) {
        service.isTranscribing = false
      }
      
      console.log(`📝 Transcription disabled for call ${callId}`)
    } catch (error) {
      console.error(`Failed to disable transcription for ${callId}:`, error)
      // Don't throw - transcription might already be stopped
    }
  }

  private async fetchTranscription(callId: string): Promise<string | null> {
    try {
      const call = streamVideo.call('default', callId)
      
      // Get call details including transcription
      const callDetails = await call.get()
      
      // Stream.io stores transcription in the call session
      // The exact API might vary - check Stream.io documentation
      const transcriptions = callDetails.call.transcription
      
      if (transcriptions && transcriptions.length > 0) {
        // Combine all transcription segments
        const fullTranscription = transcriptions
          .map((segment: any) => `[${segment.start_time}] ${segment.user_name}: ${segment.text}`)
          .join('\n')
        
        return fullTranscription
      }
      
      console.log(`⚠️ No transcription found for call ${callId}`)
      return null
      
    } catch (error) {
      console.error(`Failed to fetch transcription for ${callId}:`, error)
      return null
    }
  }

  private async storeTranscriptionInGolemDB(
    transcription: string, 
    meetId: string, 
    service: CallTranscriptionService
  ): Promise<string> {
    const duration = service.endTime 
      ? Math.floor((service.endTime.getTime() - service.startTime.getTime()) / 1000)
      : 0

    const transcriptionData: TranscriptionData = {
      meetId,
      transcription,
      participants: service.participants,
      duration,
      timestamp: service.startTime.toISOString(),
      callSummary: `Mentorship call transcription from Stream.io`,
      keyInsights: [] // Will be filled by AI analysis
    }

    return await transcriptionService.storeTranscription(transcriptionData)
  }

  // Method to add participants (called during call events)
  addParticipant(callId: string, participantId: string): void {
    const service = this.activeTranscriptions.get(callId)
    if (service && !service.participants.includes(participantId)) {
      service.participants.push(participantId)
      console.log(`👥 Added participant ${participantId} to call ${callId}`)
    }
  }

  // Get transcription status
  getTranscriptionStatus(callId: string): CallTranscriptionService | null {
    return this.activeTranscriptions.get(callId) || null
  }

  // List all active transcriptions
  getActiveTranscriptions(): CallTranscriptionService[] {
    return Array.from(this.activeTranscriptions.values())
  }
}

export const streamTranscriptionManager = new StreamTranscriptionManager()