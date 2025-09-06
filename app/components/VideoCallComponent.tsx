"use client";

import { useState, useEffect } from "react";
import { useAccount } from "@coinbase/onchainkit/wallet";
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  CallControls,
  SpeakerLayout,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Button, Icon, Card } from "./DemoComponents";

// You'll need to get these from your GetStream.io dashboard
const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || "your-api-key";

export function VideoCallComponent() {
  const { address } = useAccount();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [targetAddress, setTargetAddress] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  const isConnected = !!address;

  useEffect(() => {
    // Initialize StreamVideo client when Coinbase wallet is connected
    const initializeClient = async () => {
      if (!address || !isConnected) {
        if (client) {
          await client.disconnectUser();
          setClient(null);
        }
        return;
      }

      try {
        // In a real app, you would get the token from your backend
        // For demo purposes, we'll create a simple token
        const token = "demo-token"; // Replace with actual token generation
        
        const videoClient = new StreamVideoClient({
          apiKey: API_KEY,
          user: {
            id: address.toLowerCase(),
            name: `${address.slice(0, 6)}...${address.slice(-4)}`,
          },
          token: token,
        });

        setClient(videoClient);

        // Listen for incoming calls
        videoClient.on('call.created', (event) => {
          const incomingCall = event.call;
          if (incomingCall && !isInCall) {
            setIncomingCall(incomingCall);
          }
        });

      } catch (error) {
        console.error("Failed to initialize StreamVideo client:", error);
      }
    };

    initializeClient();

    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [address, isConnected]);

  const callAddress = async () => {
    if (!client || !targetAddress || !address) return;

    try {
      // Create a call ID based on both addresses (sorted to ensure consistency)
      const addresses = [address.toLowerCase(), targetAddress.toLowerCase()].sort();
      const callId = `call-${addresses[0]}-${addresses[1]}`;

      const newCall = client.call("default", callId);
      await newCall.getOrCreate({
        data: {
          members: [
            { user_id: address.toLowerCase() },
            { user_id: targetAddress.toLowerCase() }
          ],
          settings_override: {
            audio: { mic_default_on: true },
            video: { camera_default_on: true },
          },
        },
      });

      setCall(newCall);
      await newCall.join();
      setIsInCall(true);
    } catch (error) {
      console.error("Failed to create call:", error);
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;

    try {
      setCall(incomingCall);
      await incomingCall.join();
      setIsInCall(true);
      setIncomingCall(null);
    } catch (error) {
      console.error("Failed to accept call:", error);
    }
  };

  const rejectIncomingCall = async () => {
    if (incomingCall) {
      await incomingCall.leave();
      setIncomingCall(null);
    }
  };

  const leaveCall = async () => {
    if (call) {
      await call.leave();
      setCall(null);
      setIsInCall(false);
    }
  };

  // If Coinbase wallet is not connected
  if (!isConnected || !address) {
    return (
      <Card title="Video Calls">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mx-auto flex items-center justify-center">
            <Icon name="star" size="lg" className="text-gray-400" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--app-foreground)] mb-2">
              Connect Coinbase Wallet First
            </h3>
            <p className="text-sm text-[var(--app-foreground-muted)]">
              Connect your Coinbase wallet to start making video calls using your wallet address as your ID
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // If client is not initialized
  if (!client) {
    return (
      <Card title="Video Calls">
        <div className="text-center">
          <p className="text-[var(--app-foreground-muted)]">
            Initializing video client...
          </p>
        </div>
      </Card>
    );
  }

  // Show incoming call notification
  if (incomingCall && !isInCall) {
    return (
      <StreamVideo client={client}>
        <Card title="Incoming Call">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center animate-pulse">
              <Icon name="star" size="lg" className="text-white" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--app-foreground)] mb-2">
                Incoming Video Call
              </h3>
              <p className="text-sm text-[var(--app-foreground-muted)] mb-4">
                Someone is calling your wallet address
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={acceptIncomingCall}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                icon={<Icon name="check" size="sm" />}
              >
                Accept
              </Button>
              <Button
                onClick={rejectIncomingCall}
                variant="outline"
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          </div>
        </Card>
      </StreamVideo>
    );
  }

  // If in call
  if (isInCall && call) {
    return (
      <StreamVideo client={client}>
        <Card title="Video Call">
          <div className="space-y-4">
            <div className="bg-black rounded-lg overflow-hidden">
              <VideoCallUI call={call} onLeave={leaveCall} />
            </div>
          </div>
        </Card>
      </StreamVideo>
    );
  }

  // Main video call interface
  return (
    <StreamVideo client={client}>
      <Card title="Video Calls">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Icon name="star" size="lg" className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xs text-[var(--app-foreground-muted)] mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p><strong>Your Coinbase Wallet ID:</strong></p>
              <p className="font-mono text-xs break-all">{address}</p>
              <p className="mt-1">Share this address with others to receive calls</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--app-foreground-muted)] mb-1 block">
                Enter wallet address to call
              </label>
              <input
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)] text-sm"
              />
            </div>

            <Button
              onClick={callAddress}
              disabled={!targetAddress.trim() || targetAddress.length < 42}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              icon={<Icon name="star" size="sm" />}
            >
              Call Wallet Address
            </Button>
          </div>

          <div className="text-xs text-[var(--app-foreground-muted)] text-center">
            <p>Enter any wallet address to start a video call</p>
            <p>Both parties need to have this app open with Coinbase wallet connected</p>
          </div>
        </div>
      </Card>
    </StreamVideo>
  );
}

function VideoCallUI({ call, onLeave }: { call: Call; onLeave: () => void }) {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (callingState === CallingState.JOINING) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-white">Joining call...</p>
      </div>
    );
  }

  return (
    <div className="relative h-64">
      <SpeakerLayout />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
}
