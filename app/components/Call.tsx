import {
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  User,
} from '@stream-io/video-react-sdk';
import { useState, useEffect, useRef } from 'react';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import '../index.css';
import { v4 as uuidv4 } from 'uuid';

const apiKey = 'mmhfdzb5evj2';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL0RpYW1vbmRfQmVhayIsInVzZXJfaWQiOiJEaWFtb25kX0JlYWsiLCJ2YWxpZGl0eV9pbl9zZWNvbmRzIjo2MDQ4MDAsImlhdCI6MTc1NzE3MzM5MywiZXhwIjoxNzU3Nzc4MTkzfQ.V_2OC0EEuoaWdM_z3yttKp0ZmZZN26zCKp7z8KNmopg';
const userId = 'Diamond_Beak';

const user: User = {
  id: userId,
  name: 'Oliver',
  image: 'https://getstream.io/random_svg/?id=oliver&name=Oliver',
};

interface CallReviewProps {
  isMentor: boolean;
  callDuration: number;
  onNewCall: () => void;
  onBackToHome: () => void;
}

const CallReviewComponent = ({
  isMentor,
  callDuration,
  onNewCall,
  onBackToHome,
}: CallReviewProps) => {
  const [rating, setRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitReview = () => {
    // Here you would typically send the review to your backend
    console.log('Review submitted:', { rating, isMentor, callDuration });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-green-600 text-2xl">✅</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Thank you for your feedback!</h3>
          <p className="text-gray-600 mb-6">
            Your review helps us improve the mentoring experience for everyone.
          </p>
          <div className="space-y-3">
            <button
              onClick={onNewCall}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isMentor ? 'Accept Another Call' : 'Find Another Mentor'}
            </button>
            <button
              onClick={onBackToHome}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
      <div className="text-center max-w-md w-full">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <span className="text-blue-600 text-2xl">📞</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Call Ended</h3>
        <p className="text-gray-600 mb-4">Duration: {formatDuration(callDuration)}</p>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h4 className="text-lg font-semibold mb-4">
            {isMentor ? 'How was your mentoring session?' : 'How was your mentoring experience?'}
          </h4>

          {/* Star Rating */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Rate this session:</p>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl ${
                    star <= rating ? 'text-yellow-500' : 'text-gray-300'
                  } hover:text-yellow-500 transition-colors`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmitReview}
            disabled={rating === 0}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Submit Review
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={onNewCall}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            {isMentor ? 'Accept Another Call' : 'Find Another Mentor'}
          </button>
          <button
            onClick={onBackToHome}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Call({ isMentor }: { isMentor: boolean }) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [callId] = useState(() => `call_${uuidv4()}`);
  const [callEnded, setCallEnded] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number>(0);
  const [callDuration, setCallDuration] = useState(0);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (initializingRef.current) {
      console.log('Already initializing, skipping...');
      return;
    }

    const initializeCall = async () => {
      try {
        initializingRef.current = true;
        console.log('Initializing Stream client and call...');
        console.log(`Using call ID: ${callId}`);

        const streamClient = new StreamVideoClient({ apiKey, user, token });
        const streamCall = streamClient.call('default', callId);

        await streamCall.join({ create: true });
        setCallStartTime(Date.now());

        setClient(streamClient);
        setCall(streamCall);
        setIsInitialized(true);

        console.log('Call initialized successfully');
      } catch (error) {
        console.error('Failed to initialize call:', error);
        initializingRef.current = false;
      }
    };

    initializeCall();

    return () => {
      console.log('Cleanup called');
      if (call) {
        console.log('Leaving call...');
        call.leave().catch(console.error);
      }
      if (client) {
        console.log('Disconnecting client...');
        client.disconnectUser().catch(console.error);
      }
      initializingRef.current = false;
    };
  }, [callId]);

  const handleEndCall = async () => {
    if (call && client) {
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      setCallDuration(duration);

      try {
        await call.leave();
        await client.disconnectUser();
        setCallEnded(true);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
  };

  const handleNewCall = () => {
    setCallEnded(false);
    setCallStartTime(0);
    setCallDuration(0);
    setIsInitialized(false);
    // Trigger re-initialization by changing a key prop or state
    window.location.reload(); // Simple approach, you might want to handle this more elegantly
  };

  const handleBackToHome = () => {
    // Navigate back to home - you might want to use router here
    window.location.href = '/';
  };

  if (callEnded) {
    return (
      <CallReviewComponent
        isMentor={isMentor}
        callDuration={callDuration}
        onNewCall={handleNewCall}
        onBackToHome={handleBackToHome}
      />
    );
  }

  if (!isInitialized || !client || !call) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Initializing video call...</p>
          <p className="text-xs text-gray-400 mt-2">Call ID: {callId}</p>
        </div>
      </div>
    );
  }

  console.log('Rendering Call component with participants');
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MyUILayout isMentor={isMentor} onEndCall={handleEndCall} />
      </StreamCall>
    </StreamVideo>
  );
}

export const MyUILayout = ({
  isMentor,
  onEndCall,
}: {
  isMentor: boolean;
  onEndCall: () => void;
}) => {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();

  console.log('MyUILayout render - participants:', participants.length);

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <StreamTheme>
      <SpeakerLayout participantsBarPosition="bottom" />
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onEndCall}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          End Call
        </button>
      </div>
    </StreamTheme>
  );
};
