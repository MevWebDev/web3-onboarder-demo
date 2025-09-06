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

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "../index.css";

const apiKey = "mmhfdzb5evj2";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL1R5cGhvb25fRGVsaXZlcnkiLCJ1c2VyX2lkIjoiVHlwaG9vbl9EZWxpdmVyeSIsInZhbGlkaXR5X2luX3NlY29uZHMiOjYwNDgwMCwiaWF0IjoxNzU3MTY2MzI1LCJleHAiOjE3NTc3NzExMjV9.ys6loDSPiXX9ZVW15l_951gmx61y77P42zFgehpsRgw";
const userId = "Shai";
const callId = "Uy9X6AfT85NKpAtyI5qfh";

const user: User = {
  id: "Typhoon_Delivery",
  name: "Shai",
  image: "https://getstream.io/random_svg/?id=oliver&name=Oliver",
};

const user2: User = {
  id: "Dan",
  name: "Dan",
  image: "https://getstream.io/random_svg/?id=oliver&name=Oliver",
};

const client = new StreamVideoClient({ apiKey, user, token });
const call = client.call("default", callId);
call.join({ create: true });

export function VideoCallComponent() {
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
    return <div>Loading...</div>;
  }

  return (
    <StreamTheme>
      <SpeakerLayout participantsBarPosition="bottom" />
      <CallControls />
    </StreamTheme>
  );
};
