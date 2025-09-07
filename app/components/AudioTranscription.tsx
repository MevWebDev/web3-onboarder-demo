'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface AudioTranscriptionProps {
  onTranscriptUpdate: (transcript: string) => void;
  onAnalysisComplete: (analysis: any) => void;
  onRealtimeFeedback: (feedback: string) => void;
}

const AudioTranscription: React.FC<AudioTranscriptionProps> = ({ 
  onTranscriptUpdate, 
  onAnalysisComplete,
  onRealtimeFeedback 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing'>('idle');
  const [fullTranscript, setFullTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const transcriptChunksRef = useRef<string[]>([]);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check for Speech Recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognition);
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            console.log('📝 Final transcript chunk:', finalTranscript);
            transcriptChunksRef.current.push(finalTranscript);
            onTranscriptUpdate(finalTranscript);
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('❌ Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            alert('Microphone permission denied. Please allow microphone access.');
          }
        };
        
        recognition.onend = () => {
          console.log('🛑 Speech recognition ended');
          if (isRecording) {
            // Restart recognition if still recording (handles auto-stop after silence)
            console.log('🔄 Restarting speech recognition...');
            recognition.start();
          }
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, [isRecording, onTranscriptUpdate]);
  
  // Process transcript chunks for analysis every 30 seconds
  const processTranscriptChunk = useCallback(async () => {
    console.log('🔍 processTranscriptChunk called');
    console.log('🔍 Current chunks:', transcriptChunksRef.current);
    
    if (transcriptChunksRef.current.length === 0) {
      console.log('⚠️ No transcript chunks to process');
      return;
    }
    
    const combinedTranscript = transcriptChunksRef.current.join(' ').trim();
    console.log(`🎵 Processing ${transcriptChunksRef.current.length} transcript chunks...`);
    console.log('📝 Combined transcript being sent:', combinedTranscript);
    console.log('📏 Transcript length:', combinedTranscript.length);
    
    if (combinedTranscript.length < 3) {
      console.log('⚠️ Transcript too short, skipping processing');
      return;
    }
    
    setProcessingStatus('processing');
    
    try {
      // Send transcript to analysis API
      console.log('📡 Sending transcript to analysis API...');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: combinedTranscript
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Analysis API response:', result);
      
      const { analysis } = result;
      
      // Send to streaming analysis for real-time feedback
      try {
        const streamResponse = await fetch('/api/stream-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: combinedTranscript })
        });
        
        if (streamResponse.ok) {
          const feedback = await streamResponse.text();
          if (feedback.trim()) {
            console.log('🌊 Real-time feedback:', feedback);
            onRealtimeFeedback(feedback);
          }
        }
      } catch (streamError) {
        console.error('⚠️ Streaming analysis failed:', streamError);
      }
      
      // Update parent component with full analysis
      if (analysis) {
        console.log('🧠 Analysis results:', analysis);
        onAnalysisComplete(analysis);
      }
      
      // Clear the processed chunks
      transcriptChunksRef.current = [];
      
    } catch (error) {
      console.error('❌ Error processing transcript chunk:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    } finally {
      setProcessingStatus('idle');
    }
  }, [onAnalysisComplete, onRealtimeFeedback]);
  
  // Start recording
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      console.error('❌ Speech Recognition not available');
      alert('Speech Recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }
    
    console.log('🎙️ Starting speech recognition...');
    
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      
      // Process chunks every 30 seconds
      chunkIntervalRef.current = setInterval(processTranscriptChunk, 30000);
      
      console.log('✅ Recording started, will process chunks every 30 seconds');
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
    }
  }, [processTranscriptChunk]);
  
  // Stop recording
  const stopRecording = useCallback(async () => {
    console.log('🛑 Stopping speech recognition...');
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    
    setIsRecording(false);
    
    // Process any remaining transcript chunks
    console.log('🔄 Processing final transcript chunks...');
    await processTranscriptChunk();
    console.log('✅ Final processing complete');
  }, [processTranscriptChunk]);
  
  if (!speechSupported) {
    return (
      <div className="audio-transcription-controls">
        <div className="text-center p-4 bg-red-50 rounded">
          <p className="text-red-600 font-medium">Speech Recognition Not Supported</p>
          <p className="text-red-500 text-sm mt-1">
            Please use Chrome, Safari, or Edge browser for audio transcription.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="audio-transcription-controls">
      <div className="flex gap-4 justify-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={processingStatus === 'processing'}
          className={`px-4 py-2 text-white rounded font-semibold transition-colors ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? '🛑 Stop Recording' : '🎙️ Start Recording'}
        </button>
      </div>
      
      {processingStatus === 'processing' && (
        <div className="processing-indicator text-center mt-2">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Processing transcript...</span>
          </div>
        </div>
      )}
      
      {isRecording && (
        <div className="text-center mt-2">
          <div className="text-xs text-gray-500">
            🔴 Recording conversation for AI analysis
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Transcript processed every 30 seconds
          </div>
        </div>
      )}
      
      {transcriptChunksRef.current.length > 0 && (
        <div className="text-center mt-2">
          <div className="text-xs text-green-600">
            📝 {transcriptChunksRef.current.length} transcript chunks captured
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTranscription;