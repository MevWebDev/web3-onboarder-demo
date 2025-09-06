// app/video-lobby/page.tsx
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
import { useAccount } from 'wagmi';

// Add custom CSS for animation delays
const customStyles = `
  .animation-delay-75 {
    animation-delay: 75ms;
  }
  .animation-delay-100 {
    animation-delay: 100ms;
  }
  .animation-delay-200 {
    animation-delay: 200ms;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

// Get API key from environment
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

// Single shared call ID for the main lobby
const MAIN_LOBBY_CALL_ID = 'web3-onboarder-main-lobby';

// Token provider that fetches from our backend
const tokenProvider = async (userId: string): Promise<string> => {
  console.log('🔑 Fetching token for user:', userId);
  
  try {
    const response = await fetch('/api/stream-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Token provider error:', error);
    throw error;
  }
};

// Generate user info from wallet address
const generateUserInfo = (address?: string) => {
  const userId = address ? `user-${address.slice(2, 8)}` : `user-${Math.random().toString(36).substr(2, 8)}`;
  const userName = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Anonymous User';
  return { userId, userName };
};

interface VideoLobbyProps {
  userId: string;
  userName: string;
}

function VideoLobby({ userId, userName }: VideoLobbyProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const initializingRef = useRef(false);

  useEffect(() => {
    if (initializingRef.current) return;
    
    const initializeLobby = async () => {
      try {
        initializingRef.current = true;
        setIsLoading(true);
        setError(null);
        setConnectionState('connecting');

        console.log('🚀 Initializing video lobby for user:', userId);

        if (!apiKey) {
          throw new Error('Stream API key is not configured.');
        }

        const user: User = {
          id: userId,
          name: userName,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        };

        console.log('👤 Creating Stream client with user:', user);

        // Create Stream client with token provider
        const streamClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user,
          tokenProvider: () => tokenProvider(userId),
        });

        console.log('📞 Joining main lobby:', MAIN_LOBBY_CALL_ID);

        const streamCall = streamClient.call('default', MAIN_LOBBY_CALL_ID);
        
        // Join the main lobby (create if it doesn't exist)
        await streamCall.join({ create: true });
        console.log('✅ Successfully joined lobby');

        setClient(streamClient);
        setCall(streamCall);
        setConnectionState('connected');
      } catch (error) {
        console.error('❌ Error initializing lobby:', error);
        setConnectionState('failed');
        
        if (error instanceof Error) {
          if (error.message.includes('Token request failed')) {
            setError('Authentication failed. Please check your Stream API configuration.');
          } else if (error.message.includes('API key')) {
            setError('Stream API key is missing. Please configure your environment variables.');
          } else {
            setError(`Connection failed: ${error.message}`);
          }
        } else {
          setError('Failed to connect to video lobby. Please try again.');
        }
      } finally {
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    initializeLobby();

    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
    };
  }, [userId, userName]);

  const handleLeaveLobby = async () => {
    try {
      if (call) {
        await call.leave();
      }
      // Go back to main page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error leaving lobby:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
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
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg w-full"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg w-full"
            >
              Back to Home
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
          <h2 className="text-white text-xl mb-2">Joining Video Lobby</h2>
          <p className="text-gray-400 text-sm">Connecting as {userName}...</p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' : connectionState === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-400 text-xs">
              {connectionState === 'connecting' ? 'Connecting...' : connectionState === 'connected' ? 'Connected' : 'Failed'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <LobbyContent onLeaveLobby={handleLeaveLobby} userName={userName} />
      </StreamCall>
    </StreamVideo>
  );
}

function LobbyContent({ onLeaveLobby, userName }: { onLeaveLobby: () => void; userName: string }) {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Joining the lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-xl font-bold flex items-center">
              <span className="text-2xl mr-2">🌐</span>
              Web3 Video Lobby
            </h1>
            <p className="text-gray-400 text-sm">Everyone joins here • No codes needed</p>
          </div>
          <div className="text-right">
            <div className="text-white text-lg font-semibold">
              {participants.length} {participants.length === 1 ? 'person' : 'people'} online
            </div>
            <div className="text-gray-400 text-xs">
              You: {userName}
            </div>
          </div>
        </div>
        
        {/* Participants List */}
        {participants.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {participants.map((participant) => (
              <div
                key={participant.sessionId}
                className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300 flex items-center"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {participant.name}
                {participant.isLocalParticipant && (
                  <span className="ml-1 text-blue-400">(You)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Layout */}
      <div className="flex-1 relative bg-gray-800">
        {participants.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h2 className="text-white text-xl mb-2">Waiting for others to join...</h2>
              <p className="text-gray-400">Share your app with friends to start video chatting!</p>
            </div>
          </div>
        ) : participants.length === 1 ? (
          // Single participant (just you)
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-96 h-72 rounded-xl overflow-hidden shadow-lg">
                <ParticipantView participant={participants[0]} />
              </div>
              <p className="text-gray-400 mt-4">Youre alone in the lobby. Invite friends to join!</p>
            </div>
          </div>
        ) : participants.length === 2 ? (
          // Two participants - side by side
          <div className="h-full w-full flex space-x-4 p-4">
            {participants.map((participant) => (
              <div key={participant.sessionId} className="flex-1">
                <ParticipantView participant={participant} />
              </div>
            ))}
          </div>
        ) : (
          // Multiple participants - grid layout
          <div className="h-full w-full p-4">
            <SpeakerLayout />
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex justify-center items-center space-x-4">
          <div className="bg-gray-700 rounded-xl p-2 flex items-center space-x-2">
            <CallControls onLeave={onLeaveLobby} />
          </div>
          
          {/* Additional Info */}
          <div className="text-gray-400 text-sm hidden md:block">
            <div className="flex items-center space-x-4">
              <span>🔗 One lobby for everyone</span>
              <span>•</span>
              <span>📱 Share app to invite friends</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoLobbyPage() {
  const { address } = useAccount();
  const [userInfo, setUserInfo] = useState<{ userId: string; userName: string } | null>(null);

  useEffect(() => {
    // Generate user info based on wallet connection
    const info = generateUserInfo(address);
    setUserInfo(info);
  }, [address]);

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <VideoLobby
      userId={userInfo.userId}
      userName={userInfo.userName}
    />
  );
}