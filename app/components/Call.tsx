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
import { useState, useEffect } from 'react';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import '../index.css';

const apiKey = 'mmhfdzb5evj2';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL0RpYW1vbmRfQmVhayIsInVzZXJfaWQiOiJEaWFtb25kX0JlYWsiLCJ2YWxpZGl0eV9pbl9zZWNvbmRzIjo2MDQ4MDAsImlhdCI6MTc1NzE3MzM5MywiZXhwIjoxNzU3Nzc4MTkzfQ.V_2OC0EEuoaWdM_z3yttKp0ZmZZN26zCKp7z8KNmopg';
const userId = 'Diamond_Beak';
const callId = 'gHwCXRt4a0Yc7iZSrVE6o';

const user: User = {
  id: userId,
  name: 'Oliver',
  image: 'https://getstream.io/random_svg/?id=oliver&name=Oliver',
};

export default function Call() {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeCall = async () => {
      try {
        console.log('Initializing Stream client and call...');

        // Create client
        const streamClient = new StreamVideoClient({ apiKey, user, token });

        // Create call
        const streamCall = streamClient.call('default', callId);

        // Join the call
        await streamCall.join({ create: true });

        setClient(streamClient);
        setCall(streamCall);
        setIsInitialized(true);

        console.log('Call initialized successfully');
      } catch (error) {
        console.error('Failed to initialize call:', error);
      }
    };

    initializeCall();

    // Cleanup function
    return () => {
      if (call) {
        console.log('Leaving call...');
        call.leave().catch(console.error);
      }
      if (client) {
        console.log('Disconnecting client...');
        client.disconnectUser().catch(console.error);
      }
    };
  }, []);

  if (!isInitialized || !client || !call) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Initializing video call...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering Call component');
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MyUILayout />
      </StreamCall>
    </StreamVideo>
  );
}

export const MyUILayout = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

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
    </StreamTheme>
  );
};
