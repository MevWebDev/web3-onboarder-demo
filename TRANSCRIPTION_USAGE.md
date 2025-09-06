# Simple Transcription Storage System

This project provides a straightforward system that downloads call transcriptions from GetStream and stores them in Supabase as JSON data.

## 🏗️ Architecture

The system consists of:

1. **Supabase Database**: Stores transcription data in JSONB format
2. **TranscriptionService**: Handles all database operations  
3. **Webhook Endpoint**: Downloads and stores GetStream transcriptions
4. **API Endpoints**: Manual transcription management

## 📊 Database Schema

The `transcriptions` table stores:

```sql
- id: UUID (primary key)
- call_id: Unique call identifier
- mentor_id: ID of the mentor user
- participant_id: ID of the participant user  
- transcription_data: JSONB with segments, metadata
- call_duration_seconds: Call duration
- call_started_at/ended_at: Timestamps
- transcript_txt_url: GetStream TXT file URL
- transcript_vtt_url: GetStream VTT subtitle URL
- metadata: Additional JSON data
```

## 🚀 Usage

### Automatic Storage (GetStream Webhook)

When GetStream finishes transcribing a call, it sends a webhook to:
```
POST /api/webhooks/stream-transcription
```

The webhook automatically:
1. Fetches transcription from GetStream S3
2. Converts to structured JSON format
3. Stores directly in Supabase

### Manual Storage

Use the TranscriptionService directly:

```typescript
import { TranscriptionService } from '@/lib/transcription-service';

const transcriptionData = {
  call_id: "unique_call_id",
  mentor_id: "mentor_123", 
  participant_id: "participant_456",
  transcription_data: {
    segments: [
      {
        start_time: "0.0",
        end_time: "5.2", 
        speaker_id: "mentor",
        text: "Welcome to the session",
        confidence: 0.95
      }
      // ... more segments
    ],
    duration_seconds: 300,
    language: "en",
    word_count: 150,
    keywords: ["react", "javascript"]
  },
  call_started_at: new Date().toISOString(),
  call_ended_at: new Date().toISOString()
};

// Save transcription
const result = await TranscriptionService.saveTranscription(transcriptionData);
```

### API Endpoints

#### Store Transcription
```bash
POST /api/transcriptions
Content-Type: application/json

{
  "call_id": "unique_id",
  "mentor_id": "mentor_123",
  "participant_id": "participant_456", 
  "transcription_data": { ... },
  "call_started_at": "2024-01-01T00:00:00Z",
  "call_ended_at": "2024-01-01T00:05:00Z"
}
```

#### Retrieve Transcriptions
```bash
# Get by call ID
GET /api/transcriptions?callId=unique_id

# Get all for mentor
GET /api/transcriptions?mentorId=mentor_123

# Get all for participant  
GET /api/transcriptions?participantId=participant_456
```

#### Test Endpoint
```bash
# Create test transcription
POST /api/test-transcription

# Get test transcriptions
GET /api/test-transcription
```

## 🛠️ Setup Requirements

### 1. Environment Variables

Create `.env.local` with:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# GetStream (Required for webhook)  
NEXT_PUBLIC_STREAM_API_KEY="your_stream_key"
STREAM_SECRET_KEY="your_stream_secret"
STREAM_WEBHOOK_SECRET="your_webhook_secret"
```

### 2. Database Migration

Run the migration in Supabase SQL editor:
```sql
-- File: supabase/migrations/001_create_transcriptions_table.sql
-- This creates the transcriptions table with proper indexing
```

### 3. GetStream Webhook Configuration

In GetStream Dashboard:
1. Go to Webhooks section
2. Add endpoint: `https://your-domain.com/api/webhooks/stream-transcription`
3. Enable events: `call.transcription_ready`, `call.transcription_started`, etc.
4. Set webhook secret for signature verification

## 📝 JSON Data Format

The `transcription_data` JSONB field contains:

```json
{
  "segments": [
    {
      "start_time": "0.0",
      "end_time": "5.2",
      "speaker_id": "mentor", 
      "text": "Welcome to today's session",
      "confidence": 0.95
    }
  ],
  "transcript_txt_url": "https://stream-s3.../transcript.txt",
  "transcript_vtt_url": "https://stream-s3.../transcript.vtt",
  "duration_seconds": 300,
  "language": "en",
  "word_count": 150,
  "keywords": ["react", "javascript", "mentoring"]
}
```

## 🔍 Features

- **Automatic Processing**: GetStream webhooks trigger automatic storage
- **Structured Data**: JSON segments with timestamps and speaker identification
- **Search Support**: Full-text search on transcription content
- **Simple Storage**: Direct download and storage without additional processing
- **Flexible Queries**: Filter by date, user, call ID, keywords
- **Security**: Row-level security policies
- **Performance**: Optimized indexes for fast queries

## 🧪 Testing

Test the system:

```bash
# Create test transcription
curl -X POST http://localhost:3000/api/test-transcription

# Retrieve test data
curl http://localhost:3000/api/test-transcription

# Get specific transcription
curl "http://localhost:3000/api/transcriptions?callId=your_call_id"
```

## 🔐 Security

- Service role key required for write operations
- Row-level security enables users to only see their own transcriptions
- Webhook signature verification (optional but recommended)
- No sensitive data stored in transcription content