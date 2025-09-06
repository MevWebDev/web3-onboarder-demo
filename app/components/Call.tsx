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

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "../index.css";

const apiKey = "mmhfdzb5evj2";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL0RpYW1vbmRfQmVhayIsInVzZXJfaWQiOiJEaWFtb25kX0JlYWsiLCJ2YWxpZGl0eV9pbl9zZWNvbmRzIjo2MDQ4MDAsImlhdCI6MTc1NzE3MzM5MywiZXhwIjoxNzU3Nzc4MTkzfQ.V_2OC0EEuoaWdM_z3yttKp0ZmZZN26zCKp7z8KNmopg";
const userId = "Diamond_Beak";
const callId = "gHwCXRt4a0Yc7iZSrVE6o";

const user: User = {
  id: userId,
  name: "Oliver",
  image: "https://getstream.io/random_svg/?id=oliver&name=Oliver",
};

const client = new StreamVideoClient({ apiKey, user, token });

export default function Call() {
  const [call, setCall] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);

  const startCall = async () => {
    try {
      const newCall = client.call("default", callId);
      await newCall.join({ create: true });
      setCall(newCall);
      setIsInCall(true);
    } catch (error) {
      console.error("Failed to join call:", error);
    }
  };

  if (!isInCall || !call) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <h1 className="text-3xl font-bold mb-8">Video Call Demo</h1>
        <button
          onClick={startCall}
          className="px-8 py-4 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600 transition-colors"
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
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MyUILayout call={call} setIsInCall={setIsInCall} />
      </StreamCall>
    </StreamVideo>
  );
}

export const MyUILayout = ({ call, setIsInCall }: { call: any; setIsInCall: (value: boolean) => void }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>("");
  const [showReview, setShowReview] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

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
      pollForAnalysisResult(callId);
    };

    call.on("call.transcription_started", handleTranscriptionStarted);
    call.on("call.transcription_stopped", handleTranscriptionStopped);
    call.on("call.transcription_ready", handleTranscriptionReady);

    return () => {
      call.off("call.transcription_started", handleTranscriptionStarted);
      call.off("call.transcription_stopped", handleTranscriptionStopped);
      call.off("call.transcription_ready", handleTranscriptionReady);
    };
  }, [call]);

  const handleStartTranscription = async () => {
    if (!call) return;
    try {
      console.log("\n▶️ STARTING TRANSCRIPTION");
      console.log("Call ID:", callId);
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
    if (!call) return;
    try {
      console.log("\n⏹️ STOPPING CALL");
      console.log("Is transcribing:", isTranscribing);
      
      if (isTranscribing) {
        console.log("🛑 Stopping transcription...");
        const stopResult = await call.stopTranscription();
        console.log("✅ Transcription stop result:", stopResult);
        setTranscriptionStatus("Transcription stopped - processing...");
        setLoadingAnalysis(true);
        // Wait longer for transcription to be processed by Stream
        setTimeout(() => {
          console.log("🔍 Starting to poll for analysis results...");
          pollForAnalysisResult(callId);
        }, 10000); // Wait 10 seconds
      }
      
      console.log("📞 Leaving call...");
      await call.leave();
      setShowReview(true);
      setIsInCall(false);
    } catch (error) {
      console.error("❌ STOP CALL ERROR:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      setTranscriptionStatus(`Error stopping call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const pollForAnalysisResult = async (callId: string, attempts = 0) => {
    const maxAttempts = 60; // Poll for up to 2 minutes
    
    try {
      console.log(`🔍 Polling attempt ${attempts + 1}/${maxAttempts} for callId: ${callId}`);
      
      const response = await fetch(`/api/transcription-result/${callId}`);
      const data = await response.json();
      
      console.log("📊 Polling response:", data);
      
      if (data.analysis) {
        console.log("✅ Analysis found!", data.analysis);
        setAnalysisResult(data.analysis);
        setLoadingAnalysis(false);
        setTranscriptionStatus("Analysis complete!");
      } else if (attempts < maxAttempts) {
        // Continue polling
        console.log("⏳ No analysis yet, continuing to poll...");
        setTimeout(() => pollForAnalysisResult(callId, attempts + 1), 2000);
      } else {
        console.log("⏰ Polling timeout reached");
        setLoadingAnalysis(false);
        setTranscriptionStatus("Analysis timeout - check webhook configuration");
      }
    } catch (error) {
      console.error("❌ Error fetching analysis:", error);
      setLoadingAnalysis(false);
    }
  };

  if (callingState !== CallingState.JOINED && !showReview) {
    return <div>Loading...</div>;
  }

  if (showReview) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-center mb-4">Call Ended</h1>
        <MentorshipReview 
          analysis={analysisResult} 
          loading={loadingAnalysis}
          callId={callId}
        />
        {!loadingAnalysis && !analysisResult && (
          <div className="text-center mt-4 text-gray-600">
            <p>No transcription was recorded for this call.</p>
            <p className="text-sm mt-2">Make sure to start transcription during the call.</p>
          </div>
        )}
      </div>
    );
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