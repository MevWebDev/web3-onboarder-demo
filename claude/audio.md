# Real-time Audio Transcription & Mentor Analysis with OpenRouter + Vercel AI SDK

## Architecture Overview

This solution captures audio from Stream.io video calls, processes it in chunks, sends it to OpenRouter for transcription using Whisper models, then analyzes the transcript with a second LLM call to evaluate mentor effectiveness. The entire pipeline uses the Vercel AI SDK for seamless streaming and chaining operations.

## Technical Implementation

### 1. Install Required Dependencies

```bash
npm install @stream-io/video-react-sdk@1.20.2 \
           @openrouter/ai-sdk-provider@latest \
           ai@latest \
           recordrtc@5.6.2 \
           audiobuffer-to-wav@1.0.0 \
           webm-to-wav-converter@1.1.0 \
           dexie@3.2.5 \
           zod@3.23.8
```

### 2. Audio Capture & Processing Component

Since OpenRouter requires base64-encoded audio for transcription (no streaming support), we need to capture audio chunks and convert them to WAV format before sending:

```javascript
// components/AudioTranscription.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCallStateHooks } from "@stream-io/video-react-sdk";
import RecordRTC from 'recordrtc';
import { getWaveBlob } from 'webm-to-wav-converter';
import audioBufferToWav from 'audiobuffer-to-wav';

const AudioTranscription = ({ onTranscriptUpdate, onAnalysisComplete }) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { mediaStream } = useMicrophoneState();
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('idle');
  
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const chunkBufferRef = useRef([]);
  const chunkIntervalRef = useRef(null);
  
  // Initialize audio context for processing
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000 // Optimal for Whisper
    });
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Convert WebM blob to WAV and base64
  const convertToBase64Wav = async (webmBlob) => {
    try {
      // Convert WebM to WAV using webm-to-wav-converter
      const wavBlob = await getWaveBlob([webmBlob], false);
      
      // Convert to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Remove the data:audio/wav;base64, prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(wavBlob);
      });
    } catch (error) {
      console.error('Error converting audio:', error);
      
      // Fallback: Use Web Audio API
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const wavArrayBuffer = audioBufferToWav(audioBuffer);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(wavArrayBuffer)));
      return base64;
    }
  };
  
  // Process accumulated audio chunks every 30 seconds
  const processAudioChunk = useCallback(async () => {
    if (chunkBufferRef.current.length === 0) return;
    
    setProcessingStatus('processing');
    
    try {
      // Combine all chunks into a single blob
      const combinedBlob = new Blob(chunkBufferRef.current, { 
        type: 'audio/webm;codecs=opus' 
      });
      
      // Convert to base64 WAV
      const base64Audio = await convertToBase64Wav(combinedBlob);
      
      // Send to OpenRouter for transcription
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          audioData: base64Audio,
          format: 'wav'
        })
      });
      
      const { transcript, analysis } = await response.json();
      
      // Update parent component
      if (transcript) {
        onTranscriptUpdate(transcript);
      }
      
      if (analysis) {
        onAnalysisComplete(analysis);
      }
      
      // Clear the buffer
      chunkBufferRef.current = [];
      
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    } finally {
      setProcessingStatus('idle');
    }
  }, [onTranscriptUpdate, onAnalysisComplete]);
  
  // Start recording
  const startRecording = useCallback(() => {
    if (!mediaStream) {
      console.error('No media stream available');
      return;
    }
    
    const recorder = RecordRTC(mediaStream, {
      type: 'audio',
      mimeType: 'audio/webm;codecs=opus',
      recorderType: RecordRTC.StereoAudioRecorder,
      numberOfAudioChannels: 1,
      desiredSampRate: 16000,
      bufferSize: 4096,
      timeSlice: 1000, // Get data every second
      ondataavailable: (blob) => {
        // Add to buffer
        chunkBufferRef.current.push(blob);
      }
    });
    
    recorder.startRecording();
    recorderRef.current = recorder;
    setIsRecording(true);
    
    // Process chunks every 30 seconds
    chunkIntervalRef.current = setInterval(processAudioChunk, 30000);
  }, [mediaStream, processAudioChunk]);
  
  // Stop recording
  const stopRecording = useCallback(async () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(async () => {
        // Process any remaining chunks
        await processAudioChunk();
      });
      recorderRef.current = null;
    }
    
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    
    setIsRecording(false);
  }, [processAudioChunk]);
  
  return (
    <div className="audio-transcription-controls">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!mediaStream || processingStatus === 'processing'}
        className={`record-btn ${isRecording ? 'recording' : ''}`}
      >
        {isRecording ? '⏹ Stop Recording' : '🎙️ Start Recording'}
      </button>
      
      {processingStatus === 'processing' && (
        <div className="processing-indicator">
          Processing audio chunk...
        </div>
      )}
    </div>
  );
};

export default AudioTranscription;
```

### 3. OpenRouter API Route with Vercel AI SDK

This is the core API route that handles transcription and analysis using OpenRouter:

```javascript
// app/api/transcribe/route.js
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, streamText } from 'ai';
import { z } from 'zod';

// Initialize OpenRouter
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Schema for mentor analysis
const MentorAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(10),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  wasHelpful: z.boolean(),
  specificExamples: z.array(z.object({
    quote: z.string(),
    feedback: z.string(),
    category: z.enum(['positive', 'negative', 'neutral'])
  })),
  recommendations: z.array(z.string()),
  engagementLevel: z.enum(['high', 'medium', 'low']),
  communicationClarity: z.number().min(0).max(10),
  technicalAccuracy: z.number().min(0).max(10),
  emotionalSupport: z.number().min(0).max(10)
});

export async function POST(request) {
  try {
    const { audioData, format } = await request.json();
    
    // Step 1: Transcribe audio using Whisper through OpenRouter
    // OpenRouter supports audio in messages for compatible models
    const transcriptionResponse = await generateText({
      model: openrouter('openai/whisper-large-v3-turbo'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please transcribe this audio recording accurately.'
            },
            {
              type: 'audio',
              audio: {
                data: audioData, // base64 encoded audio
                format: format || 'wav'
              }
            }
          ]
        }
      ],
      maxTokens: 4000,
      temperature: 0.1, // Low temperature for accurate transcription
    });
    
    const transcript = transcriptionResponse.text;
    
    if (!transcript || transcript.length < 10) {
      return Response.json({ 
        error: 'Transcription failed or audio too short' 
      }, { status: 400 });
    }
    
    // Step 2: Analyze mentor effectiveness using Claude
    const analysisResponse = await generateText({
      model: openrouter('anthropic/claude-3.5-sonnet'),
      messages: [
        {
          role: 'system',
          content: `You are an expert in mentorship and coaching evaluation. Analyze the following transcript of a mentoring session and evaluate the mentor's effectiveness.
          
          Focus on:
          1. Was the mentor helpful and supportive?
          2. Did they provide clear, actionable guidance?
          3. Were they encouraging and positive?
          4. Did they listen effectively and respond to the mentee's needs?
          5. Were their technical explanations accurate and appropriate?
          6. Did they foster a growth mindset?
          
          Be specific and provide examples from the transcript.`
        },
        {
          role: 'user',
          content: `Please analyze this mentoring session transcript and evaluate the mentor's effectiveness:\n\n${transcript}`
        }
      ],
      maxTokens: 2000,
      temperature: 0.3,
      structuredOutputs: {
        schema: MentorAnalysisSchema,
        schemaName: 'MentorAnalysis',
        schemaDescription: 'Structured analysis of mentor effectiveness'
      }
    });
    
    // Step 3: Generate actionable summary
    const summaryResponse = await generateText({
      model: openrouter('openai/gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: 'Create a concise, actionable summary of the mentor analysis for both mentor and mentee.'
        },
        {
          role: 'user',
          content: JSON.stringify(analysisResponse.object)
        }
      ],
      maxTokens: 500,
      temperature: 0.5
    });
    
    // Return complete analysis
    return Response.json({
      transcript,
      analysis: analysisResponse.object,
      summary: summaryResponse.text,
      metadata: {
        transcriptionModel: 'whisper-large-v3-turbo',
        analysisModel: 'claude-3.5-sonnet',
        summaryModel: 'gpt-4o-mini',
        timestamp: new Date().toISOString(),
        audioLength: audioData.length * 0.75 / 1000 // Approximate size in KB
      }
    });
    
  } catch (error) {
    console.error('Transcription/Analysis error:', error);
    return Response.json({ 
      error: 'Failed to process audio',
      details: error.message 
    }, { status: 500 });
  }
}
```

### 4. Streaming Real-time Analysis (Alternative Approach)

For real-time feedback during the call, you can use streaming:

```javascript
// app/api/stream-analysis/route.js
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request) {
  const { transcript } = await request.json();
  
  // Stream real-time feedback as the conversation progresses
  const result = streamText({
    model: openrouter('anthropic/claude-3.5-haiku'),
    messages: [
      {
        role: 'system',
        content: `You are a real-time mentorship coach providing immediate feedback.
        Analyze the ongoing conversation and provide brief, actionable feedback.
        Focus on:
        - Is the mentor being clear and helpful?
        - Are there missed opportunities to provide better guidance?
        - Quick tips for improvement
        Keep feedback concise (2-3 sentences max per point).`
      },
      {
        role: 'user',
        content: `Analyze this part of the mentoring conversation:\n${transcript}`
      }
    ],
    maxTokens: 200,
    temperature: 0.4
  });
  
  // Return streaming response
  return result.toDataStreamResponse();
}
```

### 5. Main Application Component

Here's how to integrate everything in your main React component:

```javascript
// components/MentoringSession.jsx
import React, { useState, useCallback } from 'react';
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';
import AudioTranscription from './AudioTranscription';
import { useCompletion } from 'ai/react';
import Dexie from 'dexie';

// Initialize IndexedDB for storage
const db = new Dexie('MentoringDB');
db.version(1).stores({
  sessions: '++id, timestamp, mentorId, menteeId',
  transcripts: '++id, sessionId, chunk, timestamp',
  analyses: '++id, sessionId, timestamp, score'
});

const MentoringSession = ({ callId }) => {
  const [fullTranscript, setFullTranscript] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [realtimeFeedback, setRealtimeFeedback] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  
  // Real-time feedback using Vercel AI SDK
  const { complete: getRealtimeFeedback, completion, isLoading } = useCompletion({
    api: '/api/stream-analysis',
    onFinish: (result) => {
      setRealtimeFeedback(prev => [...prev, {
        timestamp: new Date(),
        feedback: result
      }]);
    }
  });
  
  // Handle new transcript chunks
  const handleTranscriptUpdate = useCallback(async (newTranscript) => {
    setFullTranscript(prev => prev + '\n' + newTranscript);
    
    // Save to IndexedDB
    if (sessionId) {
      await db.transcripts.add({
        sessionId,
        chunk: newTranscript,
        timestamp: new Date()
      });
    }
    
    // Get real-time feedback for this chunk
    getRealtimeFeedback(newTranscript);
  }, [sessionId, getRealtimeFeedback]);
  
  // Handle completed analysis
  const handleAnalysisComplete = useCallback(async (analysis) => {
    setLatestAnalysis(analysis);
    
    // Save to IndexedDB
    if (sessionId) {
      await db.analyses.add({
        sessionId,
        timestamp: new Date(),
        score: analysis.overallScore,
        data: analysis
      });
    }
    
    // Show notification if mentor needs improvement
    if (analysis.overallScore < 6) {
      showImprovementSuggestions(analysis.recommendations);
    }
  }, [sessionId]);
  
  // Start a new session
  const startSession = async () => {
    const id = await db.sessions.add({
      timestamp: new Date(),
      mentorId: 'current-user-id',
      menteeId: 'other-user-id'
    });
    setSessionId(id);
  };
  
  // Export session data
  const exportSession = async () => {
    if (!sessionId) return;
    
    const session = await db.sessions.get(sessionId);
    const transcripts = await db.transcripts.where('sessionId').equals(sessionId).toArray();
    const analyses = await db.analyses.where('sessionId').equals(sessionId).toArray();
    
    const exportData = {
      session,
      fullTranscript: transcripts.map(t => t.chunk).join('\n'),
      analyses: analyses.map(a => a.data),
      realtimeFeedback
    };
    
    // Create markdown report
    const markdown = generateMarkdownReport(exportData);
    downloadAsFile(markdown, `mentoring-session-${sessionId}.md`);
  };
  
  return (
    <div className="mentoring-session">
      <StreamCall callId={callId}>
        <div className="video-container">
          {/* Stream.io video components */}
        </div>
        
        <div className="transcription-panel">
          <AudioTranscription
            onTranscriptUpdate={handleTranscriptUpdate}
            onAnalysisComplete={handleAnalysisComplete}
          />
          
          <div className="realtime-feedback">
            <h3>Real-time Coaching Tips</h3>
            {isLoading && <div className="loading">Analyzing...</div>}
            {realtimeFeedback.map((item, index) => (
              <div key={index} className="feedback-item">
                <span className="timestamp">
                  {item.timestamp.toLocaleTimeString()}
                </span>
                <p>{item.feedback}</p>
              </div>
            ))}
          </div>
          
          {latestAnalysis && (
            <div className="analysis-summary">
              <h3>Session Analysis</h3>
              <div className="score">
                Overall Score: {latestAnalysis.overallScore}/10
              </div>
              
              <div className="metrics">
                <div>Clarity: {latestAnalysis.communicationClarity}/10</div>
                <div>Technical: {latestAnalysis.technicalAccuracy}/10</div>
                <div>Support: {latestAnalysis.emotionalSupport}/10</div>
              </div>
              
              <div className="strengths">
                <h4>Strengths:</h4>
                <ul>
                  {latestAnalysis.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              
              <div className="improvements">
                <h4>Areas for Improvement:</h4>
                <ul>
                  {latestAnalysis.areasForImprovement.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <div className="controls">
          <button onClick={startSession}>Start Session</button>
          <button onClick={exportSession}>Export Report</button>
        </div>
      </StreamCall>
    </div>
  );
};

// Helper functions
const generateMarkdownReport = (data) => {
  const { session, fullTranscript, analyses, realtimeFeedback } = data;
  const latestAnalysis = analyses[analyses.length - 1];
  
  return `# Mentoring Session Report
  
**Date:** ${session.timestamp.toLocaleDateString()}
**Duration:** ${calculateDuration(session.timestamp, new Date())}
**Overall Score:** ${latestAnalysis?.overallScore || 'N/A'}/10

## Executive Summary

${latestAnalysis?.summary || 'No analysis available'}

## Key Metrics

- **Communication Clarity:** ${latestAnalysis?.communicationClarity}/10
- **Technical Accuracy:** ${latestAnalysis?.technicalAccuracy}/10
- **Emotional Support:** ${latestAnalysis?.emotionalSupport}/10
- **Engagement Level:** ${latestAnalysis?.engagementLevel}

## Strengths

${latestAnalysis?.strengths.map(s => `- ${s}`).join('\n')}

## Areas for Improvement

${latestAnalysis?.areasForImprovement.map(a => `- ${a}`).join('\n')}

## Specific Examples

${latestAnalysis?.specificExamples.map(e => 
  `### ${e.category.toUpperCase()}
  > "${e.quote}"
  
  **Feedback:** ${e.feedback}`
).join('\n\n')}

## Recommendations

${latestAnalysis?.recommendations.map(r => `1. ${r}`).join('\n')}

## Real-time Feedback Log

${realtimeFeedback.map(f => 
  `**[${f.timestamp.toLocaleTimeString()}]** ${f.feedback}`
).join('\n\n')}

## Full Transcript

\`\`\`
${fullTranscript}
\`\`\`

---
*Generated with OpenRouter + Vercel AI SDK Mentoring Analysis System*`;
};

const downloadAsFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const calculateDuration = (start, end) => {
  const diff = end - start;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const showImprovementSuggestions = (recommendations) => {
  // Show toast or modal with recommendations
  console.log('Improvement needed:', recommendations);
};

export default MentoringSession;
```

### 6. Environment Variables

```env
# .env.local
OPENROUTER_API_KEY=your-openrouter-api-key
```

## How It Works

### Audio Processing Pipeline

1. **Capture**: Audio is captured from Stream.io's MediaStream in 1-second chunks
2. **Buffer**: Chunks are buffered for 30 seconds to create meaningful segments
3. **Convert**: WebM audio is converted to WAV format using `webm-to-wav-converter`
4. **Encode**: WAV is base64 encoded for API transmission
5. **Transcribe**: OpenRouter processes the audio using Whisper models

### Analysis Chain

1. **Whisper Transcription** (whisper-large-v3-turbo)
   - Converts audio to text with high accuracy
   - ~2-5 second processing time per 30-second chunk

2. **Mentor Analysis** (Claude 3.5 Sonnet)
   - Evaluates mentor effectiveness
   - Provides structured feedback with scores
   - Identifies specific examples from transcript

3. **Summary Generation** (GPT-4o Mini)
   - Creates actionable summary
   - Generates recommendations
   - Formats report for export

### Real-time Feedback Loop

- Every 30 seconds, a chunk is processed
- Streaming analysis provides immediate coaching tips
- Full analysis runs after each major segment
- All data is stored in IndexedDB for offline access

## Cost Analysis

Using OpenRouter's pricing (as of 2025):

- **Whisper Large V3 Turbo**: ~$0.10 per hour of audio
- **Claude 3.5 Sonnet**: ~$0.015 per analysis (2K tokens in, 2K out)
- **GPT-4o Mini**: ~$0.001 per summary
- **Total**: ~$0.12 per hour of mentoring + $0.016 per analysis

For a typical 1-hour mentoring session with analysis every 5 minutes:
- Total cost: ~$0.31

## Performance Optimizations

1. **Web Worker Processing**: Move audio conversion to Web Worker
2. **Chunked Processing**: Process in 30-second segments to reduce latency
3. **Parallel API Calls**: Run transcription and analysis in parallel when possible
4. **IndexedDB Caching**: Store results locally to avoid re-processing
5. **Adaptive Quality**: Reduce sample rate for longer sessions

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Requires polyfill for MediaRecorder
- **Mobile**: iOS 14.3+ and Android 7+

## Key Features

- ✅ Real-time audio capture from Stream.io calls
- ✅ Automatic audio format conversion (WebM to WAV)
- ✅ OpenRouter integration with multiple models
- ✅ Structured mentor effectiveness analysis
- ✅ Real-time coaching feedback
- ✅ Session recording and export
- ✅ Offline storage with IndexedDB
- ✅ Markdown report generation
- ✅ Cost-effective multi-model approach

This implementation provides a complete solution for transcribing and analyzing mentoring sessions using OpenRouter's unified API with the Vercel AI SDK, delivering actionable insights about mentor effectiveness in real-time.