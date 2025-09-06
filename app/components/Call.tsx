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
import React, { useState, useEffect } from "react";
import { MentorshipReview } from "./MentorshipReview";
import TranscriptionStatus from "./TranscriptionStatus";
import CallReview from "./CallReview";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "../index.css";

const userId = "Diamond_Beak";
// Generate dynamic call ID following Stream.io best practices
const generateCallId = () => {
  // Using timestamp + random for uniqueness (UUID v4 alternative)
  return `call-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const user: User = {
  id: userId,
  name: "Oliver",
  image: "https://getstream.io/random_svg/?id=oliver&name=Oliver",
};

export default function Call() {
  const [call, setCall] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string>("");
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Initialize Stream client with server-generated token
  useEffect(() => {
    const initializeStreamClient = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);
        
        console.log("🔐 Fetching Stream token from server...");
        const response = await fetch("/api/auth/stream-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const { token, apiKey } = await response.json();
        console.log("✅ Successfully fetched Stream credentials");

        // Initialize Stream client
        const streamClient = new StreamVideoClient({ apiKey, user, token });
        setClient(streamClient);
        
        // Debug: Check existing calls
        try {
          console.log("🔍 Checking for existing calls in Stream.io...");
          const { calls } = await streamClient.queryCalls({
            filter_conditions: { 
              created_by_user_id: userId 
            },
            limit: 5,
            watch: false
          });
          console.log(`📞 Found ${calls.length} existing calls:`, calls.map(c => ({
            id: c.id,
            cid: c.cid,
            created_at: (c as any).created_at,
            created_by: (c as any).created_by_user_id
          })));
        } catch (error) {
          console.error("❌ Error querying calls:", error);
        }
        
        setIsInitializing(false);
      } catch (error) {
        console.error("❌ Failed to initialize Stream client:", error);
        setInitError(error instanceof Error ? error.message : String(error));
        setIsInitializing(false);
      }
    };
    
    initializeStreamClient();
  }, []);

  const startCall = async () => {
    if (!client) {
      console.error("❌ Stream client not initialized");
      return;
    }
    
    try {
      // Generate a unique call ID for each new call
      const dynamicCallId = generateCallId();
      console.log("🆔 Generated call ID:", dynamicCallId);
      
      const newCall = client.call("default", dynamicCallId);
      
      // Use getOrCreate() to properly register the call with Stream.io
      await newCall.getOrCreate({
        data: {
          members: [{ user_id: userId, role: "admin" }], // Add current user as call member
          custom: {
            description: "Video call with transcription demo",
            created_at: new Date().toISOString()
          },
          settings_override: {
            transcription: {
              mode: "available"  // Enable transcription capability
            }
          }
        }
      });
      
      // Now join the call
      await newCall.join();
      
      // Store both the call object and the call ID
      setCall(newCall);
      setCurrentCallId(dynamicCallId);
      setIsInCall(true);
      
      console.log("✅ Call created and joined successfully!");
      console.log("📋 Call ID:", newCall.id);
      console.log("📋 Call CID:", newCall.cid);
      console.log("📋 Call State:", newCall.state);
      console.log("👥 Participants:", newCall.state.participants);
    } catch (error) {
      console.error("❌ Failed to create/join call:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
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
          Click to join the video call. Once connected, you can start transcription to record and analyze the conversation.
        </p>
      </div>
    );
  }

  return (
    <StreamVideo client={client!}>
      <StreamCall call={call}>
        <MyUILayout call={call} setIsInCall={setIsInCall} setShowReview={setShowReview} currentCallId={currentCallId} showReview={false} />
      </StreamCall>
    </StreamVideo>
  );
}

export const MyUILayout = ({ call, setIsInCall, setShowReview, currentCallId, showReview }: { call: any; setIsInCall: (value: boolean) => void; setShowReview: (value: boolean) => void; currentCallId: string; showReview: boolean }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [transcriptionStage, setTranscriptionStage] = useState<'waiting' | 'fetching' | 'analyzing' | 'complete' | 'error' | 'timeout'>('waiting');

  // Debug: Track showReview state changes
  useEffect(() => {
    console.log("🔍 STATE CHANGE DETECTED: showReview =", showReview);
    if (showReview) {
      console.log("✅ showReview is now TRUE - CallReview should render!");
    }
  }, [showReview]);

  // Debug: Track all relevant state changes
  useEffect(() => {
    console.log("📋 RENDER STATE SUMMARY:");
    console.log("  - showReview:", showReview);
    console.log("  - callingState:", callingState);
    console.log("  - isTranscribing:", isTranscribing);
  });

  useEffect(() => {
    if (!call) return;

    const handleTranscriptionStarted = () => {
      setTranscriptionStatus("Transcription started");
      setIsTranscribing(true);
    };

    const handleTranscriptionStopped = () => {
      setTranscriptionStatus("Transcription stopped");
      setIsTranscribing(false);
    };

    const handleTranscriptionReady = (event: any) => {
      console.log("Transcription ready:", event);
      setTranscriptionStatus("Transcription ready - processing...");
      // Start polling for analysis result
      setLoadingAnalysis(true);
      pollForAnalysisResult(currentCallId);
    };

    call.on("call.transcription_started", handleTranscriptionStarted);
    call.on("call.transcription_stopped", handleTranscriptionStopped);
    call.on("call.transcription_ready", handleTranscriptionReady);

    return () => {
      call.off("call.transcription_started", handleTranscriptionStarted);
      call.off("call.transcription_stopped", handleTranscriptionStopped);
      call.off("call.transcription_ready", handleTranscriptionReady);
    };
  }, [call, currentCallId]);

  const handleStartTranscription = async () => {
    if (!call) return;
    try {
      console.log("\n▶️ STARTING TRANSCRIPTION");
      console.log("Call ID:", currentCallId);
      console.log("Call object:", call);
      
      const result = await call.startTranscription({ 
        language: "en",
        closed_captions: true 
      });
      
      console.log("✅ Transcription start result:", result);
      setIsTranscribing(true);
      setTranscriptionStatus("Transcription started - recording conversation...");
    } catch (error) {
      console.error("❌ TRANSCRIPTION START ERROR:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      setTranscriptionStatus(`Failed to start transcription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStopCall = async () => {
    if (!call) {
      console.log("❌ No call object available");
      return;
    }
    
    console.log("\n⏹️ STARTING handleStopCall function");
    console.log("Initial state - isTranscribing:", isTranscribing);
    console.log("Initial state - showReview:", showReview);
    
    try {
      if (isTranscribing) {
        console.log("🛑 About to stop transcription...");
        const stopResult = await call.stopTranscription();
        console.log("✅ Transcription stopped successfully:", stopResult);
        setTranscriptionStatus("Transcription stopped - processing...");
        setIsTranscribing(false);
        setLoadingAnalysis(true);
        console.log("✅ Transcription state updates queued");
        
        // Start polling for analysis result
        setTimeout(() => {
          console.log("🔍 Starting to poll for analysis results...");
          pollForAnalysisResult(currentCallId);
        }, 3000);
      } else {
        console.log("⚠️ Not transcribing, skipping transcription stop");
      }
      
      console.log("📞 About to leave call...");
      await call.leave();
      console.log("✅ Call left successfully");
      
      console.log("📋 CRITICAL: About to set showReview = true");
      setShowReview(true);
      console.log("📋 CRITICAL: setShowReview(true) called - should trigger re-render");
      
      // Don't set isInCall to false here - let the parent handle both states
      setIsInCall(false);
      
      console.log("📋 STATE UPDATE SUMMARY:");
      console.log("  - setShowReview(true) was called");
      console.log("  - setIsInCall(false) was called");
      console.log("  - Parent should now render the review screen");
      console.log("📋 Function completed successfully - expecting re-render now");
      
    } catch (error) {
      console.error("❌ CRITICAL ERROR in handleStopCall:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ This error may prevent state updates!");
      setTranscriptionStatus(`Error stopping call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const pollForAnalysisResult = async (callId: string, attempts = 0) => {
    const maxAttempts = 60; // Poll for up to 2 minutes
    
    try {
      console.log(`🔍 Polling attempt ${attempts + 1}/${maxAttempts} for callId: ${callId}`);
      
      // First, try the new ListTranscriptions API approach
      const transcriptionResponse = await fetch(`/api/stream/list-transcriptions/${callId}`);
      const transcriptionData = await transcriptionResponse.json();
      
      console.log("📊 ListTranscriptions API response:", transcriptionData);
      
      if (transcriptionData.success && transcriptionData.hasTranscription && transcriptionData.analysis) {
        console.log("✅ Analysis found via ListTranscriptions API!", transcriptionData.analysis);
        setAnalysisResult(transcriptionData.analysis);
        setLoadingAnalysis(false);
        setTranscriptionStage('complete');
        setTranscriptionStatus("Analysis complete!");
        return;
      }
      
      // Fallback to webhook-based result checking
      const response = await fetch(`/api/transcription-result/${callId}`);
      const data = await response.json();
      
      console.log("📊 Webhook polling response:", data);
      
      // Update transcription stage based on API response
      if (data.stage) {
        setTranscriptionStage(data.stage);
        setTranscriptionStatus(data.message || "Processing...");
      }
      
      if (data.analysis) {
        console.log("✅ Analysis found via webhook!", data.analysis);
        setAnalysisResult(data.analysis);
        setLoadingAnalysis(false);
        setTranscriptionStage('complete');
        setTranscriptionStatus("Analysis complete!");
      } else if (attempts < maxAttempts) {
        // Continue polling
        const statusMsg = transcriptionData.success ? 
          `Waiting for transcription... (${transcriptionData.message || 'Processing'})` :
          `No analysis yet, stage: ${data.stage}, continuing to poll...`;
        console.log(`⏳ ${statusMsg}`);
        
        // Update status to show we're checking transcriptions
        setTranscriptionStage('fetching');
        setTranscriptionStatus("Checking for available transcriptions...");
        
        setTimeout(() => pollForAnalysisResult(callId, attempts + 1), 3000); // Poll every 3 seconds
      } else {
        console.log("⏰ Polling timeout reached");
        setLoadingAnalysis(false);
        setTranscriptionStage('timeout');
        setTranscriptionStatus("Analysis timeout - transcription may not be ready yet");
      }
    } catch (error) {
      console.error("❌ Error fetching analysis:", error);
      setLoadingAnalysis(false);
      setTranscriptionStage('error');
      setTranscriptionStatus("Error occurred while fetching analysis");
    }
  };

  // Show review screen after call ends
  if (showReview) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-center mb-4">Call Ended</h1>
        
        {/* Show transcription status component while processing */}
        <TranscriptionStatus 
          stage={transcriptionStage}
          loading={loadingAnalysis}
          hasAnalysis={!!analysisResult}
        />
        
        {/* Show call review component */}
        <div className="mb-6">
          <CallReview onReviewSubmit={(isPositive) => {
            console.log('Call review submitted:', isPositive);
          }} />
        </div>
        
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
        <div className="flex gap-4 justify-center">
          {!isTranscribing ? (
            <button
              onClick={handleStartTranscription}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
            >
              🔴 Start Transcription
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-gray-400 text-white rounded font-semibold cursor-not-allowed"
            >
              🔴 Recording...
            </button>
          )}
          <button
            onClick={handleStopCall}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            🛑 End Call & Stop Transcription
          </button>
        </div>
        {transcriptionStatus && (
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-sm font-medium text-gray-700">
              {transcriptionStatus}
            </div>
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