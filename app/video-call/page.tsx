// app/video-call/page.tsx
"use client";

import {
  StreamVideo,
  StreamVideoClient,
  User,
  StreamCall,
  CallControls,
  CallingState,
  SpeakerLayout,
  useCallStateHooks,
  ParticipantView,
  Call,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useEffect, useState, useRef } from 'react';

// Get API key from environment
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

// Token provider that fetches from our backend
const tokenProvider = async (userId: string): Promise<string> => {
  console.log('🔑 Fetching token for user:', userId);
  
  try {
    const apiUrl = '/api/stream-token';
    console.log('📡 Making request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token request failed with status:', response.status);
      console.error('❌ Response text:', errorText);
      
      // Try to parse as JSON for better error message
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(`Token request failed (${response.status}): ${errorData.error || errorData.message || 'Unknown error'}`);
      } catch  {
        // If it's not JSON, it might be an HTML error page
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
          throw new Error(`API route not found or returned HTML instead of JSON. Status: ${response.status}`);
        }
        throw new Error(`Token request failed (${response.status}): ${errorText}`);
      }
    }

    const responseText = await response.text();
    console.log('📡 Raw response:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('✅ Token received successfully');
      console.log('📄 Response data:', { ...data, token: data.token ? '[HIDDEN]' : 'MISSING' });
      
      if (!data.token) {
        throw new Error('Token is missing from response');
      }
      
      return data.token;
    } catch (jsonError) {
      console.error('❌ Failed to parse response as JSON:', jsonError);
      console.error('❌ Response was:', responseText);
      throw new Error('Invalid JSON response from token endpoint');
    }

  } catch (error) {
    console.error('❌ Token provider error:', error);
    throw error;
  }
};

interface VideoCallUIProps {
  callId: string;
  userId: string;
  userName: string;
}

function VideoCallUI({ callId, userId, userName }: VideoCallUIProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializingRef.current) return;
    
    const initializeCall = async () => {
      try {
        initializingRef.current = true;
        setIsLoading(true);
        setError(null);

        console.log('Initializing call for user:', userId);

        if (!apiKey) {
          throw new Error('Stream API key is not configured. Please add NEXT_PUBLIC_STREAM_API_KEY to your environment variables.');
        }

        const user: User = {
          id: userId,
          name: userName,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        };

        console.log('Creating Stream client with user:', user);

        // Create Stream client with token provider
        const streamClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user,
          tokenProvider: () => tokenProvider(userId),
        });

        console.log('Stream client created, joining call:', callId);

        const streamCall = streamClient.call('default', callId);
        
        // Join or create the call
        await streamCall.join({ create: true });
        console.log('Successfully joined call');

        setClient(streamClient);
        setCall(streamCall);
      } catch (error) {
        console.error('Error initializing call:', error);
        
        // Provide specific error messages based on error type
        if (error instanceof Error) {
          if (error.message.includes('Token request failed')) {
            setError('Authentication failed. Please check your Stream API configuration and try again.');
          } else if (error.message.includes('API key')) {
            setError('Stream API key is missing. Please configure your environment variables.');
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            setError('Network error. Please check your internet connection and try again.');
          } else {
            setError(`Connection failed: ${error.message}`);
          }
        } else {
          setError('Failed to initialize video call. Please try again.');
        }
      } finally {
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    initializeCall();

    return () => {
      // Cleanup function
      if (call) {
        call.leave().catch(console.error);
      }
    };
  }, [callId, userId, userName]);

  const handleEndCall = async () => {
    try {
      if (call) {
        await call.leave();
      }
      if (typeof window !== 'undefined') {
        window.close();
      }
    } catch (error) {
      console.error('Error ending call:', error);
      if (typeof window !== 'undefined') {
        window.close();
      }
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl mb-4">Connection Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="bg-gray-800 p-4 rounded-lg mb-6 text-left">
            <h3 className="text-white text-sm font-semibold mb-2">Setup Required:</h3>
            <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
              <li>Get your Stream API key from <a href="https://getstream.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">getstream.io</a></li>
              <li>Add NEXT_PUBLIC_STREAM_API_KEY to your .env.local</li>
              <li>Add STREAM_API_SECRET to your .env.local</li>
              <li>Restart your development server</li>
            </ol>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg w-full"
            >
              Try Again
            </button>
            <button
              onClick={() => window.close()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg w-full"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !client || !call) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Connecting to video call...</p>
          <p className="text-gray-400 text-sm mt-2">User: {userName}</p>
          {apiKey && (
            <p className="text-gray-400 text-xs mt-1">API Key: {apiKey.slice(0, 8)}...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <VideoCallContent onEndCall={handleEndCall} callId={callId} />
      </StreamCall>
    </StreamVideo>
  );
}

function VideoCallContent({ onEndCall, callId }: { onEndCall: () => void; callId: string }) {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();

  // Extract the short code from the call ID for display
  const callCode = callId.includes('-') ? callId.split('-')[1] : callId;

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Joining call...</p>
          <p className="text-gray-400 text-sm mt-2">Call Code: {callCode}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-white text-lg font-semibold">Web3 Video Call</h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-gray-400 text-sm">Call Code: <span className="font-mono text-blue-400">{callCode}</span></p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(callCode);
                alert('Call code copied! Share with friends to invite them.');
              }}
              className="text-gray-400 hover:text-blue-400 transition-colors"
              title="Copy call code"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-sm font-medium">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </div>
          <div className="text-gray-400 text-xs">
            {participants.map(p => p.name).join(', ')}
          </div>
        </div>
      </div>

      {/* Video Layout */}
      <div className="flex-1 relative">
        {participants.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📹</div>
              <p className="text-white mb-2">Waiting for participants...</p>
              <p className="text-gray-400 text-sm">Share call code <span className="font-mono text-blue-400">{callCode}</span> with friends</p>
            </div>
          </div>
        ) : participants.length === 1 ? (
          // Single participant view
          <div className="h-full w-full">
            <ParticipantView participant={participants[0]} />
          </div>
        ) : (
          // Multiple participants view
          <SpeakerLayout />
        )}
      </div>

      {/* Call Controls */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex justify-center">
          <div className="bg-gray-700 rounded-xl p-2">
            <CallControls onLeave={onEndCall} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoCallPage() {
  const [callData, setCallData] = useState<{
    callId: string;
    userId: string;
    userName: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Get call data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const callId = urlParams.get('callId');
    const userId = urlParams.get('userId');
    const userName = urlParams.get('userName');

    if (callId && userId && userName) {
      setCallData({ 
        callId: decodeURIComponent(callId), 
        userId: decodeURIComponent(userId), 
        userName: decodeURIComponent(userName) 
      });
    } else {
      alert('Invalid call parameters. Please start a new video call.');
      if (typeof window !== 'undefined') {
        window.close();
      }
    }
    setIsValidating(false);
  }, []);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading call...</p>
        </div>
      </div>
    );
  }

  if (!callData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <p className="text-white mb-4">Invalid call parameters</p>
          <button
            onClick={() => window.close()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoCallUI
      callId={callData.callId}
      userId={callData.userId}
      userName={callData.userName}
    />
  );
}