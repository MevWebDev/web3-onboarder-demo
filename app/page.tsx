// app/page.tsx
"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { Button, Icon, Card } from "./components/DemoComponents";

// Video call utility functions
const generateCallId = () => {
  return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateUserId = (address?: string) => {
  if (address) {
    return `user-${address.slice(2, 8)}`;
  }
  return `user-${Math.random().toString(36).substr(2, 9)}`;
};

const getUserName = (address?: string) => {
  if (address) {
    return `User ${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return `Anonymous User`;
};

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();
  const { address, isConnected } = useAccount();
  const [isVideoCallLoading, setIsVideoCallLoading] = useState(false);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    await addFrame();
  }, [addFrame]);

  const handleStartVideoCall = useCallback(async () => {
    setIsVideoCallLoading(true);
    
    try {
      const callId = generateCallId();
      const userId = generateUserId(address);
      const userName = getUserName(address);

      // Create video call URL
      const videoCallUrl = new URL('/video-call', window.location.origin);
      videoCallUrl.searchParams.set('callId', callId);
      videoCallUrl.searchParams.set('userId', userId);
      videoCallUrl.searchParams.set('userName', userName);

      // Open video call in new window
      const videoWindow = window.open(
        videoCallUrl.toString(),
        'videoCall',
        'width=1200,height=800,scrollbars=no,resizable=yes,status=no,toolbar=no,menubar=no,location=no'
      );

      if (!videoWindow) {
        alert('Please allow popups for video calls to work properly.');
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call. Please try again.');
    } finally {
      setIsVideoCallLoading(false);
    }
  }, [address]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save App
        </Button>
      );
    }
    return null;
  }, [context, handleAddFrame]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-6 h-11">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W3</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--app-foreground)]">
                Web3 Onboarder
              </h1>
              <p className="text-xs text-[var(--app-foreground-muted)]">
                Your gateway to Web3
              </p>
            </div>
          </div>
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1 space-y-6">
          {/* Hero Section */}
          <Card className="text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
                <Icon name="star" size="lg" className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--app-foreground)] mb-2">
                  Welcome to Web3
                </h2>
                <p className="text-[var(--app-foreground-muted)] text-sm leading-relaxed">
                  Start your decentralized journey with the easiest onboarding
                  experience. Connect your wallet and explore the world of Web3
                  on Base.
                </p>
              </div>
            </div>
          </Card>

          {/* Wallet Connection */}
          <Card title="Connect Your Wallet">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Wallet className="z-10">
                  <ConnectWallet className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-all">
                    <Name className="text-inherit" />
                  </ConnectWallet>
                  <WalletDropdown>
                    <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                      <Avatar />
                      <Name />
                      <Address />
                      <EthBalance />
                    </Identity>
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                </Wallet>
              </div>
              <p className="text-center text-xs text-[var(--app-foreground-muted)]">
                Secure, fast, and built on Base network
              </p>
            </div>
          </Card>

          {/* Video Call Section */}
          <Card title="Connect with Video">
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl mx-auto flex items-center justify-center mb-3">
                  <svg 
                    className="w-6 h-6 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                    />
                  </svg>
                </div>
                <p className="text-sm text-[var(--app-foreground-muted)] mb-4">
                  Start a video call to get personalized Web3 guidance
                </p>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleStartVideoCall}
                  disabled={isVideoCallLoading}
                >
                  {isVideoCallLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Starting Call...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg 
                        className="w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                        />
                      </svg>
                      <span>Start Video Call</span>
                    </div>
                  )}
                </Button>
              </div>
              {isConnected && (
                <p className="text-xs text-center text-[var(--app-foreground-muted)]">
                  Connected as {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              )}
            </div>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto flex items-center justify-center">
                  <Icon
                    name="check"
                    className="text-green-600 dark:text-green-400"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--app-foreground)] text-sm">
                    Secure
                  </h3>
                  <p className="text-xs text-[var(--app-foreground-muted)]">
                    Bank-level security
                  </p>
                </div>
              </div>
            </Card>

            <Card className="text-center">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto flex items-center justify-center">
                  <Icon
                    name="star"
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--app-foreground)] text-sm">
                    Easy
                  </h3>
                  <p className="text-xs text-[var(--app-foreground-muted)]">
                    Simple setup
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Getting Started */}
          <Card title="Getting Started">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                    1
                  </div>
                  <span className="text-sm text-[var(--app-foreground-muted)]">
                    Connect your wallet above
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400">
                    2
                  </div>
                  <span className="text-sm text-[var(--app-foreground-muted)]">
                    Join the video lobby above
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400">
                    3
                  </div>
                  <span className="text-sm text-[var(--app-foreground-muted)]">
                    Explore Base ecosystem
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => openUrl("https://base.org/ecosystem")}
                icon={<Icon name="arrow-right" size="sm" />}
              >
                Explore Base Ecosystem
              </Button>
            </div>
          </Card>
        </main>

        <footer className="mt-6 pt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}