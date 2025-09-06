# GetStream Transcription Integration with Supabase

This document explains how to integrate GetStream's transcription service with Supabase for storing call transcriptions.

## Architecture Overview

1. **GetStream** handles the video calls and automatic transcription
2. **Supabase** stores the structured transcription data in JSON format
3. **Webhooks** receive transcription events from GetStream
4. **API Routes** process and store the transcription data

## Setup

### 1. Database Setup

Run the migration to create the transcriptions table:

```bash
# Run in Supabase SQL editor or via migration
psql -f supabase/migrations/001_create_transcriptions_table.sql
```

### 2. Environment Variables

Add to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GetStream Configuration
NEXT_PUBLIC_STREAM_API_KEY=your_getstream_api_key
STREAM_SECRET_KEY=your_getstream_secret_key
STREAM_WEBHOOK_SECRET=your_webhook_secret  # Optional: for webhook signature verification
```

### 3. Configure GetStream Webhooks

In your GetStream Dashboard:

1. Navigate to your app settings
2. Go to Webhooks section
3. Add webhook endpoint: `https://your-domain.com/api/webhooks/getstream`
4. Enable the following events:
   - `call.ended` - Creates placeholder record when call ends
   - `call.transcription_ready` - Updates record with transcription data

## Usage

### Enable Transcription for a Call

```typescript
import { enableCallTranscription, initializeStreamClient } from '@/lib/getstream-client';

// Initialize client
const streamClient = initializeStreamClient(
  process.env.NEXT_PUBLIC_STREAM_API_KEY!,
  userId,
  userToken
);

// Enable transcription when starting a call
await enableCallTranscription(streamClient, 'default', callId);
```

### Manual Transcription Save (if needed)

```typescript
import { useTranscription } from '@/hooks/useTranscription';

function CallComponent() {
  const { saveTranscription, processGetStreamTranscription } = useTranscription();

  const handleTranscriptionData = async (getstreamData: any) => {
    // Process GetStream transcription format
    const transcriptionData = processGetStreamTranscription(getstreamData);

    // Save to Supabase
    const saved = await saveTranscription({
      call_id: callId,
      session_id: sessionId,
      mentor_id: mentorId,
      participant_id: participantId,
      transcript_txt_url: getstreamData.url,
      transcript_vtt_url: getstreamData.vtt_url,
      transcription_data: transcriptionData,
      call_duration_seconds: duration,
      call_started_at: startTime,
      call_ended_at: endTime,
      metadata: {
        call_type: 'mentoring',
        platform: 'getstream'
      }
    });

    if (saved) {
      console.log('Transcription saved:', saved.id);
    }
  };
}
```

### Retrieve Transcriptions

```typescript
import { useTranscription } from '@/hooks/useTranscription';

const { getTranscription } = useTranscription();

// Get transcription by call ID
const transcription = await getTranscription('call_123');

// Or use API endpoints directly
// GET /api/transcriptions?callId=call_123
// GET /api/transcriptions?mentorId=mentor_123
// GET /api/transcriptions?participantId=participant_123
```

## Data Flow

1. **Call Starts**: Enable transcription via GetStream API
2. **Call Ends**: GetStream sends `call.ended` webhook
   - Creates placeholder record in Supabase
3. **Transcription Ready**: GetStream sends `call.transcription_ready` webhook
   - Updates record with full transcription data
   - Stores transcript URLs and structured segments

## Database Schema

```typescript
interface TranscriptionRecord {
  id: string;                      // UUID
  call_id: string;                 // GetStream call ID
  session_id: string;               // GetStream session ID
  mentor_id: string;                // Mentor user ID
  participant_id: string;           // Participant user ID
  transcript_txt_url: string;       // URL to text transcript
  transcript_vtt_url: string;       // URL to VTT subtitle file
  transcription_data: {             // Structured JSON data
    segments: Array<{
      start_time: string;
      end_time: string;
      speaker_id: string;
      text: string;
      confidence?: number;
    }>;
    duration_seconds: number;
    keywords: string[];
    word_count: number;
  };
  call_duration_seconds: number;
  call_started_at: timestamp;
  call_ended_at: timestamp;
  transcription_ready_at: timestamp;
  metadata: JSON;                   // Additional metadata
}
```

## Webhook Processing

The webhook handler (`/api/webhooks/getstream`) automatically:

1. Receives GetStream events
2. Extracts transcription data and segments
3. Processes text to extract keywords
4. Saves structured data to Supabase
5. Maintains transcript URLs for reference

## Security

- Row Level Security (RLS) enabled on Supabase
- Users can only read their own transcriptions
- Service role required for inserts/updates
- Webhook signature verification (when configured)

## API Endpoints

### `POST /api/transcriptions`
Create new transcription record

### `GET /api/transcriptions`
Query transcriptions by:
- `callId` - Single call transcription
- `mentorId` - All mentor's transcriptions
- `participantId` - All participant's transcriptions

### `POST /api/webhooks/getstream`
Webhook endpoint for GetStream events

## Troubleshooting

### Transcription Not Saving
1. Check GetStream webhook configuration
2. Verify environment variables are set
3. Check Supabase connection and permissions
4. Review webhook logs in GetStream dashboard

### Missing Transcription Data
1. Ensure transcription is enabled for the call type
2. Verify GetStream transcription settings
3. Check if `call.transcription_ready` event is being sent

## References

- [GetStream Transcription Docs](https://getstream.io/video/docs/api/transcribing/calls/)
- [GetStream Webhooks](https://getstream.io/video/docs/api/webhooks/overview/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)