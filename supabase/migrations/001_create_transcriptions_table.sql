-- Create transcriptions table for storing call transcriptions from GetStream
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id VARCHAR(255) NOT NULL UNIQUE,  -- GetStream call ID
  session_id VARCHAR(255),  -- GetStream session ID
  mentor_id VARCHAR(255) NOT NULL,
  participant_id VARCHAR(255) NOT NULL,
  transcript_txt_url TEXT,  -- GetStream transcript text URL
  transcript_vtt_url TEXT,  -- GetStream VTT subtitle URL  
  transcription_data JSONB NOT NULL,  -- Structured transcription data
  call_duration_seconds INTEGER,
  call_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  call_ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  transcription_ready_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX idx_transcriptions_call_id ON transcriptions(call_id);
CREATE INDEX idx_transcriptions_mentor_id ON transcriptions(mentor_id);
CREATE INDEX idx_transcriptions_participant_id ON transcriptions(participant_id);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX idx_transcriptions_transcription_data ON transcriptions USING GIN(transcription_data);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Policy for reading transcriptions (users can read their own transcriptions)
CREATE POLICY "Users can read their own transcriptions" ON transcriptions
  FOR SELECT
  USING (
    auth.uid()::text = participant_id OR 
    auth.uid()::text = mentor_id
  );

-- Policy for inserting transcriptions (service role only)
CREATE POLICY "Service role can insert transcriptions" ON transcriptions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy for updating transcriptions (service role only)
CREATE POLICY "Service role can update transcriptions" ON transcriptions
  FOR UPDATE
  USING (auth.role() = 'service_role');