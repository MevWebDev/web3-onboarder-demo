import { supabaseAdmin } from './supabase';
import type { 
  CreateTranscriptionRequest, 
  TranscriptionResponse, 
  TranscriptionData 
} from '@/types/supabase';

export class TranscriptionService {
  /**
   * Save or update transcription data to Supabase
   * Updates if call_id exists, creates new record otherwise
   */
  static async saveOrUpdateTranscription(data: CreateTranscriptionRequest): Promise<TranscriptionResponse | null> {
    try {
      // Check if transcription exists for this call_id
      const { data: existing } = await supabaseAdmin
        .from('transcriptions')
        .select('id')
        .eq('call_id', data.call_id)
        .single();

      let transcription;
      
      if (existing) {
        // Update existing record
        const { data: updated, error } = await supabaseAdmin
          .from('transcriptions')
          .update(data)
          .eq('call_id', data.call_id)
          .select()
          .single();

        if (error) {
          console.error('Error updating transcription:', error);
          throw error;
        }
        transcription = updated;
      } else {
        // Insert new record
        const { data: inserted, error } = await supabaseAdmin
          .from('transcriptions')
          .insert(data)
          .select()
          .single();

        if (error) {
          console.error('Error saving transcription:', error);
          throw error;
        }
        transcription = inserted;
      }

      return transcription;
    } catch (error) {
      console.error('Failed to save/update transcription:', error);
      return null;
    }
  }

  /**
   * Save transcription data to Supabase after call ends
   */
  static async saveTranscription(data: CreateTranscriptionRequest): Promise<TranscriptionResponse | null> {
    try {
      const { data: transcription, error } = await supabaseAdmin
        .from('transcriptions')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error saving transcription:', error);
        throw error;
      }

      return transcription;
    } catch (error) {
      console.error('Failed to save transcription:', error);
      return null;
    }
  }

  /**
   * Get transcription by call ID
   */
  static async getTranscriptionByCallId(callId: string): Promise<TranscriptionResponse | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transcriptions')
        .select('*')
        .eq('call_id', callId)
        .single();

      if (error) {
        console.error('Error fetching transcription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch transcription:', error);
      return null;
    }
  }

  /**
   * Get all transcriptions for a mentor
   */
  static async getMentorTranscriptions(mentorId: string): Promise<TranscriptionResponse[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transcriptions')
        .select('*')
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching mentor transcriptions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch mentor transcriptions:', error);
      return [];
    }
  }

  /**
   * Get all transcriptions for a participant
   */
  static async getParticipantTranscriptions(participantId: string): Promise<TranscriptionResponse[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transcriptions')
        .select('*')
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching participant transcriptions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch participant transcriptions:', error);
      return [];
    }
  }

  /**
   * Update S3 URL after upload
   */
  static async updateS3Url(callId: string, s3Url: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('transcriptions')
        .update({ s3_url: s3Url })
        .eq('call_id', callId);

      if (error) {
        console.error('Error updating S3 URL:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update S3 URL:', error);
      return false;
    }
  }

  /**
   * Search transcriptions by keywords
   */
  static async searchTranscriptions(keywords: string[]): Promise<TranscriptionResponse[]> {
    try {
      const searchQuery = keywords.map(k => `'${k}'`).join(' | ');
      
      const { data, error } = await supabaseAdmin
        .from('transcriptions')
        .select('*')
        .textSearch('transcription_data', searchQuery)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching transcriptions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search transcriptions:', error);
      return [];
    }
  }

  /**
   * Get transcriptions within date range
   */
  static async getTranscriptionsByDateRange(
    startDate: string, 
    endDate: string
  ): Promise<TranscriptionResponse[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transcriptions')
        .select('*')
        .gte('call_started_at', startDate)
        .lte('call_ended_at', endDate)
        .order('call_started_at', { ascending: false });

      if (error) {
        console.error('Error fetching transcriptions by date:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch transcriptions by date:', error);
      return [];
    }
  }

  /**
   * Delete transcription by ID (admin only)
   */
  static async deleteTranscription(transcriptionId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('transcriptions')
        .delete()
        .eq('id', transcriptionId);

      if (error) {
        console.error('Error deleting transcription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete transcription:', error);
      return false;
    }
  }
}