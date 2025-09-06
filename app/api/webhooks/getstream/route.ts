import { NextRequest, NextResponse } from 'next/server';
import { TranscriptionService } from '@/lib/transcription-service';
import type { TranscriptionData, TranscriptionSegment } from '@/types/supabase';

// GetStream webhook event types
interface GetStreamCallEndedEvent {
  type: 'call.ended';
  call: {
    id: string;
    session_id: string;
    created_by: {
      id: string;
      name?: string;
    };
    participants: Array<{
      user_id: string;
      role?: string;
    }>;
    duration: number;
    started_at: string;
    ended_at: string;
  };
}

interface GetStreamTranscriptionReadyEvent {
  type: 'call.transcription_ready';
  call_cid: string;
  call: {
    id: string;
    session_id: string;
    transcription: {
      filename: string;
      url: string;  // Text transcript URL
      vtt_url?: string;  // VTT subtitle URL
      segments?: Array<{
        start: number;
        end: number;
        text: string;
        speaker_id: string;
      }>;
    };
    duration: number;
    created_by: {
      id: string;
    };
    participants: Array<{
      user_id: string;
      role?: string;
    }>;
    started_at: string;
    ended_at: string;
  };
}

type GetStreamWebhookEvent = GetStreamCallEndedEvent | GetStreamTranscriptionReadyEvent;

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if GetStream provides one
    const signature = request.headers.get('x-webhook-signature');
    // TODO: Implement signature verification based on GetStream's documentation

    const event: GetStreamWebhookEvent = await request.json();
    console.log('GetStream webhook event:', event.type);

    // Handle transcription ready event
    if (event.type === 'call.transcription_ready') {
      return await handleTranscriptionReady(event);
    }

    // Handle call ended event (if you want to create a placeholder record)
    if (event.type === 'call.ended') {
      return await handleCallEnded(event);
    }

    return NextResponse.json(
      { message: 'Event type not handled' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing GetStream webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleTranscriptionReady(event: GetStreamTranscriptionReadyEvent) {
  try {
    const { call } = event;
    
    // Find mentor and participant from the participants array
    // Assuming mentor has role 'host' or is the creator
    const mentorId = call.created_by.id;
    const participants = call.participants.filter(p => p.user_id !== mentorId);
    const participantId = participants[0]?.user_id || 'unknown';

    // Process segments into our format
    const segments: TranscriptionSegment[] = [];
    let wordCount = 0;

    if (call.transcription.segments) {
      for (const segment of call.transcription.segments) {
        segments.push({
          start_time: new Date(call.started_at).getTime() + segment.start * 1000 + '',
          end_time: new Date(call.started_at).getTime() + segment.end * 1000 + '',
          speaker_id: segment.speaker_id,
          text: segment.text,
        });
        
        // Count words
        wordCount += segment.text.split(' ').filter(w => w.length > 0).length;
      }
    }

    // Extract keywords (simple implementation - you can enhance this)
    const allText = segments.map(s => s.text).join(' ');
    const words = allText.toLowerCase().split(/\W+/).filter(w => w.length > 5);
    const wordFreq = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    const transcriptionData: TranscriptionData = {
      segments,
      transcript_txt_url: call.transcription.url,
      transcript_vtt_url: call.transcription.vtt_url,
      duration_seconds: call.duration,
      language: 'en', // GetStream might provide this
      keywords,
      word_count: wordCount,
    };

    // Save or update transcription in Supabase
    const saved = await TranscriptionService.saveOrUpdateTranscription({
      call_id: call.id,
      session_id: call.session_id,
      mentor_id: mentorId,
      participant_id: participantId,
      transcript_txt_url: call.transcription.url,
      transcript_vtt_url: call.transcription.vtt_url,
      transcription_data: transcriptionData,
      call_duration_seconds: call.duration,
      call_started_at: call.started_at,
      call_ended_at: call.ended_at,
      transcription_ready_at: new Date().toISOString(),
      metadata: {
        filename: call.transcription.filename,
        event_type: 'transcription_ready',
      },
    });

    if (saved) {
      console.log('Transcription saved successfully:', saved.id);
    }

    return NextResponse.json(
      { success: true, message: 'Transcription processed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error handling transcription ready:', error);
    return NextResponse.json(
      { error: 'Failed to process transcription' },
      { status: 500 }
    );
  }
}

async function handleCallEnded(event: GetStreamCallEndedEvent) {
  try {
    const { call } = event;
    
    // Create a placeholder record that will be updated when transcription is ready
    const mentorId = call.created_by.id;
    const participants = call.participants.filter(p => p.user_id !== mentorId);
    const participantId = participants[0]?.user_id || 'unknown';

    const saved = await TranscriptionService.saveOrUpdateTranscription({
      call_id: call.id,
      session_id: call.session_id,
      mentor_id: mentorId,
      participant_id: participantId,
      transcription_data: {
        segments: [],
        duration_seconds: call.duration,
      },
      call_duration_seconds: call.duration,
      call_started_at: call.started_at,
      call_ended_at: call.ended_at,
      metadata: {
        event_type: 'call_ended',
        awaiting_transcription: true,
      },
    });

    if (saved) {
      console.log('Call record created, awaiting transcription:', saved.id);
    }

    return NextResponse.json(
      { success: true, message: 'Call record created' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error handling call ended:', error);
    return NextResponse.json(
      { error: 'Failed to process call ended event' },
      { status: 500 }
    );
  }
}