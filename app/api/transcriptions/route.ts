import { NextRequest, NextResponse } from 'next/server';
import { TranscriptionService } from '@/lib/transcription-service';
import type { CreateTranscriptionRequest } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    const body: CreateTranscriptionRequest = await request.json();

    // Validate required fields
    if (!body.call_id || !body.mentor_id || !body.participant_id || !body.transcription_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save transcription to Supabase
    const transcription = await TranscriptionService.saveTranscription(body);

    if (!transcription) {
      return NextResponse.json(
        { error: 'Failed to save transcription' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: transcription },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/transcriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    const mentorId = searchParams.get('mentorId');
    const participantId = searchParams.get('participantId');

    // Get transcription by call ID
    if (callId) {
      const transcription = await TranscriptionService.getTranscriptionByCallId(callId);
      return NextResponse.json({ data: transcription });
    }

    // Get all transcriptions for a mentor
    if (mentorId) {
      const transcriptions = await TranscriptionService.getMentorTranscriptions(mentorId);
      return NextResponse.json({ data: transcriptions });
    }

    // Get all transcriptions for a participant
    if (participantId) {
      const transcriptions = await TranscriptionService.getParticipantTranscriptions(participantId);
      return NextResponse.json({ data: transcriptions });
    }

    return NextResponse.json(
      { error: 'Please provide callId, mentorId, or participantId parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in GET /api/transcriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}