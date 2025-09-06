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

import { useAccount } from "wagmi";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useCallback } from "react";
import { Button, Icon, Card } from "./components/DemoComponents";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { address } = useAccount();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  const isConnected = !!address;

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    await addFrame();
  }, [addFrame]);

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
              <span className="text-white font-bold text-sm">📞</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--app-foreground)]">
                Wallet Phone
              </h1>
              <p className="text-xs text-[var(--app-foreground-muted)]">
                Call any wallet directly
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
                <span className="text-white text-2xl">📞</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--app-foreground)] mb-2">
                  Wallet-to-Wallet Calling
                </h2>
                <p className="text-[var(--app-foreground-muted)] text-sm leading-relaxed">
                  Make direct video calls to any wallet address. They'll receive
                  a ringing notification and can accept or decline your call.
                </p>

                {isConnected && address && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                      📞 Ready to make calls!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                      Your ID: {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Wallet Connection - Priority */}
          <Card title="1. Connect Your Wallet">
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
                Your wallet address becomes your phone number
              </p>
            </div>
          </Card>

          {/* Video Call Component */}
          <div className="relative">
            <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg z-10">
              2. Make Calls
            </div>
          </div>

          {/* How Calling Works */}
          <Card title="How Calling Works">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                    📞
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--app-foreground)]">
                      You Call Someone
                    </span>
                    <p className="text-xs text-[var(--app-foreground-muted)]">
                      Enter their wallet address and click call
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400 mt-0.5">
                    🔔
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--app-foreground)]">
                      They Get Notification
                    </span>
                    <p className="text-xs text-[var(--app-foreground-muted)]">
                      Their app shows incoming call with your address
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400 mt-0.5">
                    ✅
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--app-foreground)]">
                      Accept or Decline
                    </span>
                    <p className="text-xs text-[var(--app-foreground-muted)]">
                      They choose to accept or decline your call
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-xs font-medium text-orange-600 dark:text-orange-400 mt-0.5">
                    📹
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--app-foreground)]">
                      Video Call Starts
                    </span>
                    <p className="text-xs text-[var(--app-foreground-muted)]">
                      If accepted, you both join the video call
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  <strong>Note:</strong> Both people need this app open to make
                  and receive calls. It works like a phone - one person calls,
                  the other answers!
                </p>
              </div>
            </div>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">📞</span>
                </div>
                <div>
                  <h3 className="font-medium text-[var(--app-foreground)] text-sm">
                    Direct Calling
                  </h3>
                  <p className="text-xs text-[var(--app-foreground-muted)]">
                    Like a phone
                  </p>
                </div>
              </div>
            </Card>

            <Card className="text-center">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400">🔔</span>
                </div>
                <div>
                  <h3 className="font-medium text-[var(--app-foreground)] text-sm">
                    Ring & Answer
                  </h3>
                  <p className="text-xs text-[var(--app-foreground-muted)]">
                    Accept/decline
                  </p>
                </div>
              </div>
            </Card>
          </div>
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
