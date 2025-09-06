"use client";

import { useState, useEffect } from "react";
// Using wagmi useAccount for now due to OnchainKit compatibility
import { useAccount } from "wagmi";
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

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || "mmhfdzb5evj2";

type CallState = "idle" | "calling" | "ringing" | "in-call" | "incoming";

export function VideoCallComponent() {
  const { address } = useAccount();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [targetAddress, setTargetAddress] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [callerAddress, setCallerAddress] = useState<string>("");
  const [currentCallId, setCurrentCallId] = useState<string>("");

  const isConnected = !!address;

  async function generateUserToken(userId: string): Promise<string> {
    // Simple demo token - in production, use your backend
    const payload = {
      user_id: userId,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };
    return btoa(JSON.stringify(payload));
  }

  // Generate random callId for each new call
  const generateCallId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `call_${timestamp}_${random}`;
  };

  useEffect(() => {
    const initializeClient = async () => {
      if (!address || !isConnected) {
        if (client) {
          await client.disconnectUser();
          setClient(null);
        }
        return;
      }

      try {
        // Use wallet address directly as userId (lowercase for consistency)
        const userId = address.toLowerCase();

        // In production, get this token from your backend
        const token = await generateUserToken(userId);

        const videoClient = new StreamVideoClient({
          apiKey: API_KEY,
          user: {
            id: userId, // Wallet address as userId
            name: `${address.slice(0, 6)}...${address.slice(-4)}`,
            image: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
          },
          token: token,
        });

        setClient(videoClient);

        // With:
        await videoClient.connectUser({
          id: userId,
          name: `${address.slice(0, 6)}...${address.slice(-4)}`,
          image: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        });
        console.log(`✅ Connected to Stream as ${userId}`);

        // Listen for incoming calls
        videoClient.on("call.ring", (event) => {
          console.log("📞 Incoming call event:", event);
          if (event.call && callState === "idle") {
            // Store the call object (type assertion for compatibility)
            setIncomingCall(event.call as any);
            setCallState("incoming");

            // Get caller address from call custom data
            const customData = event.call.custom;
            if (customData && customData.caller_address) {
              setCallerAddress(customData.caller_address as string);
            }

            console.log(
              `📞 Receiving call from: ${customData?.caller_address}`,
            );
          }
        });

        videoClient.on("call.accepted", (event) => {
          console.log("✅ Call accepted:", event);
          setCallState("in-call");
        });

        videoClient.on("call.rejected", (event) => {
          console.log("❌ Call rejected:", event);
          setCallState("idle");
          setCall(null);
          setIncomingCall(null);
          setCallerAddress("");
        });

        videoClient.on("call.ended", (event) => {
          console.log("📴 Call ended:", event);
          setCallState("idle");
          setCall(null);
          setIncomingCall(null);
          setCallerAddress("");
          setCurrentCallId("");
        });
      } catch (error) {
        console.error("❌ Failed to initialize StreamVideo client:", error);
      }
    };

    initializeClient();

    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [address, isConnected, callState]);

  const initiateCall = async () => {
    if (!client || !targetAddress || !address) return;

    try {
      setCallState("calling");

      // Generate random callId for this specific call
      const callId = generateCallId();
      setCurrentCallId(callId);

      console.log(`🔥 Creating call with ID: ${callId}`);
      console.log(`👤 Caller: ${address} (userId: ${address.toLowerCase()})`);
      console.log(
        `📞 Target: ${targetAddress} (userId: ${targetAddress.toLowerCase()})`,
      );

      const newCall = client.call("default", callId);

      // Create call with both users identified by their wallet addresses
      await newCall.getOrCreate({
        data: {
          members: [
            { user_id: address.toLowerCase() }, // Caller's wallet address as userId
            { user_id: targetAddress.toLowerCase() }, // Receiver's wallet address as userId
          ],
          settings_override: {
            audio: { mic_default_on: true, default_device: "default" as any },
            video: { camera_default_on: true },
          },
          custom: {
            caller_address: address,
            receiver_address: targetAddress,
            call_type: "wallet_to_wallet",
            call_id: callId,
            created_at: new Date().toISOString(),
          },
        },
      });

      setCall(newCall);

      // Ring the target user (they must be online in the app to receive this)
      await newCall.ring();

      console.log(`📞 Ringing ${targetAddress}... (Call ID: ${callId})`);
    } catch (error) {
      console.error("❌ Failed to initiate call:", error);
      setCallState("idle");
      setCurrentCallId("");
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      console.log("✅ Accepting incoming call...");
      setCall(incomingCall);
      await incomingCall.accept();
      await incomingCall.join();
      setCallState("in-call");
      setIncomingCall(null);
      setCurrentCallId(incomingCall.id);
    } catch (error) {
      console.error("❌ Failed to accept call:", error);
      setCallState("idle");
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;

    try {
      console.log("❌ Rejecting incoming call...");
      await incomingCall.reject();
      setIncomingCall(null);
      setCallState("idle");
      setCallerAddress("");
    } catch (error) {
      console.error("❌ Failed to reject call:", error);
    }
  };

  const endCall = async () => {
    if (!call) return;

    try {
      console.log("📴 Ending call...");
      await call.leave();
      await call.endCall();
      setCall(null);
      setCallState("idle");
      setCurrentCallId("");
    } catch (error) {
      console.error("❌ Failed to end call:", error);
    }
  };

  const cancelCall = async () => {
    if (!call) return;

    try {
      console.log("🚫 Cancelling call...");
      await call.leave();
      setCall(null);
      setCallState("idle");
      setCurrentCallId("");
    } catch (error) {
      console.error("❌ Failed to cancel call:", error);
    }
  };

  // If Coinbase wallet is not connected
  if (!isConnected || !address) {
    return (
      <Card title="📞 Video Calls">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mx-auto flex items-center justify-center">
            <Icon name="star" size="lg" className="text-gray-400" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--app-foreground)] mb-2">
              Connect Coinbase Wallet First
            </h3>
            <p className="text-sm text-[var(--app-foreground-muted)]">
              Connect your wallet to start making calls. Your wallet address
              becomes your unique caller ID.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // If client is not initialized
  if (!client) {
    return (
      <Card title="📞 Video Calls">
        <div className="text-center space-y-2">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-[var(--app-foreground-muted)] text-sm">
            Initializing video client...
          </p>
        </div>
      </Card>
    );
  }

  // Show incoming call notification
  if (callState === "incoming" && incomingCall) {
    return (
      <StreamVideo client={client}>
        <Card title="📞 Incoming Call">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center animate-pulse">
              <span className="text-white text-2xl">📞</span>
            </div>
            <div>
              <h3 className="font-medium text-[var(--app-foreground)] mb-2">
                Incoming Video Call
              </h3>
              <p className="text-sm text-[var(--app-foreground-muted)] mb-2">
                <strong>From:</strong>{" "}
                {callerAddress
                  ? `${callerAddress.slice(0, 6)}...${callerAddress.slice(-4)}`
                  : "Unknown"}
              </p>
              <p className="text-xs text-[var(--app-foreground-muted)] font-mono mb-4">
                Call ID: {incomingCall.id}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={acceptCall}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                icon={<Icon name="check" size="sm" />}
              >
                Accept Call
              </Button>
              <Button
                onClick={rejectCall}
                variant="outline"
                className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
              >
                Decline
              </Button>
            </div>
          </div>
        </Card>
      </StreamVideo>
    );
  }

  // Show calling state (waiting for answer)
  if (callState === "calling") {
    return (
      <StreamVideo client={client}>
        <Card title="📞 Calling...">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center animate-pulse">
              <span className="text-white text-2xl">📞</span>
            </div>
            <div>
              <h3 className="font-medium text-[var(--app-foreground)] mb-2">
                Calling...
              </h3>
              <p className="text-sm text-[var(--app-foreground-muted)] mb-2">
                <strong>Calling:</strong> {targetAddress.slice(0, 6)}...
                {targetAddress.slice(-4)}
              </p>
              <p className="text-xs text-[var(--app-foreground-muted)] font-mono mb-2">
                Call ID: {currentCallId}
              </p>
              <p className="text-xs text-[var(--app-foreground-muted)]">
                Waiting for them to answer...
              </p>
            </div>
            <Button
              onClick={cancelCall}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Cancel Call
            </Button>
          </div>
        </Card>
      </StreamVideo>
    );
  }

  // Show active video call
  if (callState === "in-call" && call) {
    return (
      <StreamVideo client={client}>
        <Card title="📹 Video Call Active">
          <div className="space-y-4">
            <div className="text-center text-xs text-[var(--app-foreground-muted)] font-mono">
              Call ID: {currentCallId || call.id}
            </div>
            <div className="bg-black rounded-lg overflow-hidden">
              <VideoCallUI call={call} onEndCall={endCall} />
            </div>
          </div>
        </Card>
      </StreamVideo>
    );
  }

  // Main interface - ready to make calls
  return (
    <StreamVideo client={client}>
      <Card title="📞 Make a Call">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <span className="text-4xl">📞</span>
            </div>
            <div className="text-xs text-[var(--app-foreground-muted)] mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p>
                <strong>Your Caller ID (Wallet Address):</strong>
              </p>
              <p className="font-mono text-xs break-all">{address}</p>
              <p className="mt-2">
                <strong>Your User ID:</strong>
              </p>
              <p className="font-mono text-xs break-all">
                {address.toLowerCase()}
              </p>
              <p className="mt-1 text-green-600 dark:text-green-400">
                ✅ Online and ready to receive calls
              </p>
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

            {targetAddress && targetAddress.length >= 42 && (
              <div className="text-xs text-[var(--app-foreground-muted)] bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <p>
                  <strong>Target User ID:</strong> {targetAddress.toLowerCase()}
                </p>
                <p>
                  <strong>New Call ID:</strong> Will be generated randomly
                </p>
              </div>
            )}

            <Button
              onClick={initiateCall}
              disabled={!targetAddress.trim() || targetAddress.length < 42}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              icon={<span className="text-sm">📞</span>}
            >
              Call{" "}
              {targetAddress
                ? `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`
                : "Wallet Address"}
            </Button>
          </div>

          <div className="text-xs text-[var(--app-foreground-muted)] text-center">
            <p>
              💡 <strong>How it works:</strong>
            </p>
            <p>• Your wallet address = Your caller ID</p>
            <p>• Each call gets a random unique ID</p>
            <p>• Target user must be online in this app to receive calls</p>
          </div>
        </div>
      </Card>
    </StreamVideo>
  );
}

function VideoCallUI({
  call,
  onEndCall,
}: {
  call: Call;
  onEndCall: () => void;
}) {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (callingState === CallingState.JOINING) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-white text-sm">Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-64">
      <SpeakerLayout />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <CallControls onLeave={onEndCall} />
      </div>
    </div>
  );
}
