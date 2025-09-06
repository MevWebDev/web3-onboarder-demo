import { NextRequest, NextResponse } from 'next/server';
import { TranscriptionService } from '@/lib/transcription-service';
import type { CreateTranscriptionRequest, TranscriptionData } from '@/types/supabase';

/**
 * Test endpoint to manually store transcription data in Supabase
 * This demonstrates how to use the TranscriptionService to store JSON transcription data
 */
export async function POST(request: NextRequest) {
  try {
    // Example transcription data - simple JSON format
    const exampleTranscriptionData: TranscriptionData = {
      segments: [
        {
          start_time: "0.0",
          end_time: "5.2",
          speaker_id: "mentor",
          text: "Welcome to today's mentoring session. How can I help you?",
          confidence: 0.95
        },
        {
          start_time: "5.3",
          end_time: "12.1",
          speaker_id: "participant", 
          text: "Hi! I'm struggling with understanding React hooks, especially useEffect.",
          confidence: 0.92
        },
        {
          start_time: "12.2",
          end_time: "25.8",
          speaker_id: "mentor",
          text: "Great question! Let me explain useEffect. It's a React hook that lets you perform side effects in function components.",
          confidence: 0.98
        }
      ],
      duration_seconds: 300,
      language: "en",
      word_count: 45,
      keywords: ["react", "hooks", "useEffect", "mentoring"]
    };

    // Create transcription record
    const transcriptionRequest: CreateTranscriptionRequest = {
      call_id: `test_${Date.now()}`,
      session_id: "session_123",
      mentor_id: "mentor_456",
      participant_id: "participant_789",
      transcript_txt_url: "https://example.com/transcripts/test.txt",
      transcript_vtt_url: "https://example.com/transcripts/test.vtt",
      transcription_data: exampleTranscriptionData,
      call_duration_seconds: 300,
      call_started_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      call_ended_at: new Date().toISOString(),
      transcription_ready_at: new Date().toISOString(),
      metadata: {
        test: true,
        created_via: "test-endpoint",
        timestamp: new Date().toISOString()
      }
    };

    // Save to Supabase
    const result = await TranscriptionService.saveOrUpdateTranscription(transcriptionRequest);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to save transcription to Supabase' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test transcription saved successfully',
      data: result
    }, { status: 201 });

  } catch (error) {
    console.error('Error in test transcription endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve test transcriptions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');

    if (callId) {
      const transcription = await TranscriptionService.getTranscriptionByCallId(callId);
      return NextResponse.json({ data: transcription });
    }

    // Get all transcriptions for test mentor
    const transcriptions = await TranscriptionService.getMentorTranscriptions('mentor_456');
    
    return NextResponse.json({
      success: true,
      count: transcriptions.length,
      data: transcriptions
    });

  } catch (error) {
    console.error('Error retrieving test transcriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}