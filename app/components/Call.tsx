import {
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  User,
} from "@stream-io/video-react-sdk";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import { MentorshipReview } from "./MentorshipReview";
import AIAnalysisResult from "./AIAnalysisResult";
import CallReview from "./CallReview";

// Use real audio transcription with OpenRouter API
const AudioTranscription = dynamic(() => import('./AudioTranscription'), { 
  ssr: false,
  loading: () => <div className="text-sm text-gray-500">Loading audio system...</div>
});

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "../index.css";

const userId = 'Diamond_Beak';
// Generate dynamic call ID following Stream.io best practices
const generateCallId = () => {
  // Using timestamp + random for uniqueness (UUID v4 alternative)
  return `call-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const user: User = {
  id: userId,
  name: 'Oliver',
  image: 'https://getstream.io/random_svg/?id=oliver&name=Oliver',
};

export default function Call() {
  const [call, setCall] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string>('');
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize Stream client with server-generated token
  useEffect(() => {
    const initializeStreamClient = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        console.log('🔐 Fetching Stream token from server...');
        const response = await fetch('/api/auth/stream-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const { token, apiKey } = await response.json();
        console.log('✅ Successfully fetched Stream credentials');

        // Initialize Stream client
        const streamClient = new StreamVideoClient({ apiKey, user, token });
        setClient(streamClient);

        // Debug: Check existing calls
        try {
          console.log('🔍 Checking for existing calls in Stream.io...');
          const { calls } = await streamClient.queryCalls({
            filter_conditions: {
              created_by_user_id: userId,
            },
            limit: 5,
            watch: false,
          });
          console.log(
            `📞 Found ${calls.length} existing calls:`,
            calls.map((c) => ({
              id: c.id,
              cid: c.cid,
              created_at: (c as any).created_at,
              created_by: (c as any).created_by_user_id,
            })),
          );
        } catch (error) {
          console.error('❌ Error querying calls:', error);
        }

        setIsInitializing(false);
      } catch (error) {
        console.error('❌ Failed to initialize Stream client:', error);
        setInitError(error instanceof Error ? error.message : String(error));
        setIsInitializing(false);
      }
    };

    initializeStreamClient();
  }, []);

  const startCall = async () => {
    if (!client) {
      console.error('❌ Stream client not initialized');
      return;
    }

    try {
      // Generate a unique call ID for each new call
      const dynamicCallId = generateCallId();
      const staticId = 'mango';
      console.log('🆔 Generated call ID:', dynamicCallId);

      const newCall = client.call('default', staticId);

      // Use getOrCreate() to properly register the call with Stream.io
      await newCall.getOrCreate({
        data: {
          members: [{ user_id: userId, role: 'admin' }], // Add current user as call member
          custom: {
            description: 'Video call with transcription demo',
            created_at: new Date().toISOString(),
          },
          settings_override: {
            transcription: {
              mode: 'available', // Enable transcription capability
            },
          },
        },
      });

      // Now join the call
      await newCall.join();

      // Store both the call object and the call ID
      setCall(newCall);
      setCurrentCallId(dynamicCallId);
      setIsInCall(true);

      console.log('✅ Call created and joined successfully!');
      console.log('📋 Call ID:', newCall.id);
      console.log('📋 Call CID:', newCall.cid);
      console.log('📋 Call State:', newCall.state);
      console.log('👥 Participants:', newCall.state.participants);
    } catch (error) {
      console.error('❌ Failed to create/join call:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <h1 className="text-3xl font-bold mb-8">Video Call Demo</h1>
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Initializing Stream client...</span>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <h1 className="text-3xl font-bold mb-8">Video Call Demo</h1>
        <div className="text-red-600 text-center">
          <p className="mb-4">❌ Failed to initialize Stream client:</p>
          <p className="text-sm bg-red-50 p-4 rounded">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show review screen after call ends
  if (showReview) {
    return (
      <StreamVideo client={client!}>
        <MyUILayout
          call={call}
          setIsInCall={setIsInCall}
          setShowReview={setShowReview}
          currentCallId={currentCallId}
          showReview={true}
        />
      </StreamVideo>
    );
  }

  // Show join call screen when not in call
  if (!isInCall || !call) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <h1 className="text-3xl font-bold mb-8">Video Call Demo</h1>
        <button
          onClick={startCall}
          disabled={!client}
          className="px-8 py-4 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🎥 Join Video Call
        </button>
        <p className="mt-4 text-gray-600 text-center max-w-md">
          Click to join the video call. Once connected, you can start transcription to record and
          analyze the conversation.
        </p>
      </div>
    );
  }

  return (
    <StreamVideo client={client!}>
      <StreamCall call={call}>
        <MyUILayout
          call={call}
          setIsInCall={setIsInCall}
          setShowReview={setShowReview}
          currentCallId={currentCallId}
          showReview={false}
        />
      </StreamCall>
    </StreamVideo>
  );
}

export const MyUILayout = ({
  call,
  setIsInCall,
  setShowReview,
  currentCallId,
  showReview,
}: {
  call: any;
  setIsInCall: (value: boolean) => void;
  setShowReview: (value: boolean) => void;
  currentCallId: string;
  showReview: boolean;
}) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [transcriptionStage, setTranscriptionStage] = useState<'waiting' | 'fetching' | 'analyzing' | 'complete' | 'error' | 'timeout'>('waiting');
  const [fullTranscript, setFullTranscript] = useState<string>('');
  const [realtimeFeedback, setRealtimeFeedback] = useState<string[]>([]);

  // Debug: Track showReview state changes
  useEffect(() => {
    console.log('🔍 STATE CHANGE DETECTED: showReview =', showReview);
    if (showReview) {
      console.log('✅ showReview is now TRUE - CallReview should render!');
    }
  }, [showReview]);

  // Debug: Track all relevant state changes
  useEffect(() => {
    console.log('📋 RENDER STATE SUMMARY:');
    console.log('  - showReview:', showReview);
    console.log('  - callingState:', callingState);
    console.log('  - isTranscribing:', isTranscribing);
  });

  // New handlers for audio transcription system
  const handleTranscriptUpdate = useCallback((newTranscript: string) => {
    console.log('📝 New transcript chunk received:', newTranscript);
    setFullTranscript(prev => prev + '\n' + newTranscript);
    setTranscriptionStatus('Recording and analyzing conversation...');
  }, []);
  
  const handleAnalysisComplete = useCallback((analysis: any) => {
    console.log('🧠 Analysis completed:', analysis);
    setAnalysisResult(analysis);
    setTranscriptionStage('complete');
    setTranscriptionStatus('AI analysis complete!');
    setLoadingAnalysis(false);
  }, []);
  
  const handleRealtimeFeedback = useCallback((feedback: string) => {
    console.log('🌊 Real-time feedback:', feedback);
    setRealtimeFeedback(prev => [...prev, feedback]);
  }, []);

  const handleStartTranscription = async () => {
    console.log('🎙️ Starting audio transcription system...');
    setIsTranscribing(true);
    setTranscriptionStatus('Ready to record - waiting for audio...');
    setTranscriptionStage('waiting');
  };

  const handleStopCall = async () => {
    if (!call) {
      return;
    }
    
    try {
      if (isTranscribing) {
        setTranscriptionStatus("Stopping recording and processing final audio...");
        setIsTranscribing(false);
        setLoadingAnalysis(true);
      }
      
      await call.leave();
      setIsInCall(false);
      
      // Wait for any pending analysis to complete before showing review
      setTimeout(() => {
        setShowReview(true);
      }, 500);
      
    } catch (error) {
      console.error("❌ Error stopping call:", error);
      setTranscriptionStatus(`Error stopping call: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoadingAnalysis(false);
    }
  };

  // Show review screen after call ends
  if (showReview) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-center mb-4">Call Ended</h1>
        
        {/* Show AI Analysis Result */}
        <div className="mb-6">
          <AIAnalysisResult 
            isLoading={loadingAnalysis}
            analysis={analysisResult}
          />
        </div>
        
        {/* Show call review component */}
        <div className="mb-6">
          <CallReview
            onReviewSubmit={(isPositive) => {
              console.log('Call review submitted:', isPositive);
            }}
          />
        </div>
        
        {/* Show real-time feedback if available */}
        {realtimeFeedback.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Real-time Coaching Insights</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {realtimeFeedback.slice(-3).map((feedback, index) => (
                <div key={index} className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  {feedback}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show mentorship review once analysis is complete */}
        <MentorshipReview
          analysis={analysisResult}
          loading={loadingAnalysis}
          callId={currentCallId}
        />

        {/* Show fallback message if no transcription and not loading */}
        {!loadingAnalysis && !analysisResult && transcriptionStage === 'waiting' && (
          <div className="text-center mt-4 text-gray-600">
            <p>No transcription was recorded for this call.</p>
            <p className="text-sm mt-2">Make sure to start transcription during the call.</p>
          </div>
        )}
      </div>
    );
  }

  // Show loading if not joined to call yet
  if (callingState !== CallingState.JOINED) {
    return <div>Loading...</div>;
  }

  return (
    <StreamTheme>
      <SpeakerLayout participantsBarPosition="bottom" />
      <div className="flex flex-col gap-4 p-4">
        <CallControls />
        <div className="space-y-4">
          {/* Audio Transcription Component */}
          {isTranscribing && (
            <AudioTranscription 
              onTranscriptUpdate={handleTranscriptUpdate}
              onAnalysisComplete={handleAnalysisComplete}
              onRealtimeFeedback={handleRealtimeFeedback}
            />
          )}
          
          <div className="flex gap-4 justify-center">
            {!isTranscribing ? (
              <button
                onClick={handleStartTranscription}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
              >
                🔴 Start Recording
              </button>
            ) : (
              <div className="text-center">
                <div className="text-sm text-green-600 font-medium mb-2">🔴 AI Recording Active</div>
                <div className="text-xs text-gray-500">Audio being analyzed in real-time</div>
              </div>
            )}
            <button
              onClick={handleStopCall}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              🛑 End Call & Stop Recording
            </button>
          </div>
        </div>
        {transcriptionStatus && (
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-sm font-medium text-gray-700">{transcriptionStatus}</div>
            {isTranscribing && (
              <div className="text-xs text-gray-500 mt-1">
                Conversation is being recorded for analysis
              </div>
            )}
          </div>
        )}
      </div>
    </StreamTheme>
  );
};