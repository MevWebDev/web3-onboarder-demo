export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      transcriptions: {
        Row: {
          id: string
          call_id: string
          session_id: string | null
          mentor_id: string
          participant_id: string
          transcript_txt_url: string | null
          transcript_vtt_url: string | null
          transcription_data: TranscriptionData
          call_duration_seconds: number | null
          call_started_at: string
          call_ended_at: string
          transcription_ready_at: string | null
          created_at: string
          updated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          call_id: string
          session_id?: string | null
          mentor_id: string
          participant_id: string
          transcript_txt_url?: string | null
          transcript_vtt_url?: string | null
          transcription_data: TranscriptionData
          call_duration_seconds?: number | null
          call_started_at: string
          call_ended_at: string
          transcription_ready_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          call_id?: string
          session_id?: string | null
          mentor_id?: string
          participant_id?: string
          transcript_txt_url?: string | null
          transcript_vtt_url?: string | null
          transcription_data?: TranscriptionData
          call_duration_seconds?: number | null
          call_started_at?: string
          call_ended_at?: string
          transcription_ready_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// GetStream transcription data structure
export interface TranscriptionSegment {
  start_time: string
  end_time: string
  speaker_id: string
  text: string
  confidence?: number
}

export interface TranscriptionData {
  segments: TranscriptionSegment[]
  transcript_txt_url?: string  // GetStream's text file URL
  transcript_vtt_url?: string  // GetStream's VTT subtitle URL
  duration_seconds?: number
  language?: string
  summary?: string
  keywords?: string[]
  word_count?: number
}

// API Response types
export interface TranscriptionResponse {
  id: string
  call_id: string
  session_id: string | null
  mentor_id: string
  participant_id: string
  transcript_txt_url: string | null
  transcript_vtt_url: string | null
  transcription_data: TranscriptionData
  call_duration_seconds: number | null
  call_started_at: string
  call_ended_at: string
  transcription_ready_at: string | null
  created_at: string
  updated_at: string
  metadata: Json
}

export interface CreateTranscriptionRequest {
  call_id: string
  session_id?: string
  mentor_id: string
  participant_id: string
  transcript_txt_url?: string
  transcript_vtt_url?: string
  transcription_data: TranscriptionData
  call_duration_seconds?: number
  call_started_at: string
  call_ended_at: string
  transcription_ready_at?: string
  metadata?: Json
}