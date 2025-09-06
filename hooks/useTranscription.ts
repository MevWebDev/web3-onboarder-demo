import { useState, useCallback } from 'react';
import type { 
  CreateTranscriptionRequest, 
  TranscriptionResponse,
  TranscriptionData,
  TranscriptionSegment 
} from '@/types/supabase';

interface UseTranscriptionReturn {
  isProcessing: boolean;
  error: string | null;
  saveTranscription: (data: CreateTranscriptionRequest) => Promise<TranscriptionResponse | null>;
  getTranscription: (callId: string) => Promise<TranscriptionResponse | null>;
  updateS3Url: (callId: string, s3Url: string) => Promise<boolean>;
  processRawTranscription: (rawData: any) => TranscriptionData;
}

export function useTranscription(): UseTranscriptionReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTranscription = useCallback(async (
    data: CreateTranscriptionRequest
  ): Promise<TranscriptionResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/transcriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save transcription');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error saving transcription:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getTranscription = useCallback(async (
    callId: string
  ): Promise<TranscriptionResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/transcriptions?callId=${callId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transcription');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching transcription:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const updateS3Url = useCallback(async (
    callId: string, 
    s3Url: string
  ): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/transcriptions/s3-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callId, s3Url }),
      });

      if (!response.ok) {
        throw new Error('Failed to update S3 URL');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error updating S3 URL:', err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processGetStreamTranscription = useCallback((getstreamData: any): TranscriptionData => {
    // Process GetStream transcription data
    const segments: TranscriptionSegment[] = [];
    let totalWords = 0;
    const keywords = new Set<string>();

    // Process GetStream segments
    if (getstreamData.segments && Array.isArray(getstreamData.segments)) {
      getstreamData.segments.forEach((segment: any) => {
        const processedSegment: TranscriptionSegment = {
          start_time: segment.start?.toString() || '0',
          end_time: segment.end?.toString() || '0',
          speaker_id: segment.speaker_id || 'unknown',
          text: segment.text || '',
          confidence: segment.confidence,
        };
        segments.push(processedSegment);

        // Count words
        totalWords += processedSegment.text.split(' ').filter(w => w.length > 0).length;

        // Extract potential keywords (words longer than 5 characters)
        processedSegment.text.split(/\W+/).forEach(word => {
          if (word.length > 5) {
            keywords.add(word.toLowerCase());
          }
        });
      });
    }

    return {
      segments,
      transcript_txt_url: getstreamData.url,
      transcript_vtt_url: getstreamData.vtt_url,
      duration_seconds: getstreamData.duration,
      language: getstreamData.language || 'en',
      keywords: Array.from(keywords).slice(0, 20), // Top 20 keywords
      word_count: totalWords,
    };
  }, []);

  return {
    isProcessing,
    error,
    saveTranscription,
    getTranscription,
    updateS3Url,
    processGetStreamTranscription,
  };
}