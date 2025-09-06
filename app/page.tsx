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
import { useEffect, useMemo, useCallback } from "react";
import { Button, Icon, Card } from "./components/DemoComponents";
import { VideoCallComponent } from "./components/VideoCallComponent";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

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
              <span className="text-white font-bold text-sm">📹</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--app-foreground)]">
                Coinbase Video Calls
              </h1>
              <p className="text-xs text-[var(--app-foreground-muted)]">
                Call any wallet address
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
                  Coinbase Wallet Calls
                </h2>
                <p className="text-[var(--app-foreground-muted)] text-sm leading-relaxed">
                  Connect your Coinbase wallet and call any other wallet address
                  directly. Your wallet address is your unique video call ID.
                </p>
              </div>
            </div>
          </Card>

          {/* Wallet Connection - Priority */}
          <Card title="1. Connect Coinbase Wallet">
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
                Your Coinbase wallet address becomes your unique video call ID
              </p>
            </div>
          </Card>

          {/* Video Call Component */}
          <div className="relative">
            <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg z-10">
              2. Start Calling
            </div>
            <VideoCallComponent />
          </div>

          {/* How It Works */}
          <Card title="How It Works">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--app-foreground)]">
                      Connect Coinbase Wallet
                    </span>
                    <p className="text-xs text-[var(--app-foreground-muted)]">
                      Your address becomes your video call ID
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--app-foreground)]">
                      Enter Target Address
                    </span>
                    <p className="text-xs text-[var(--app-foreground-muted)]">
                      Input any wallet address you want to call
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--app-foreground)]">
                      Start Video Call
                    </span>
                    <p className="text-xs text-[var(--app-foreground-muted)]">
                      Direct peer-to-peer video calling
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  <strong>Note:</strong> Both parties need to have this app open
                  with Coinbase wallets connected to make/receive calls.
                </p>
              </div>
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
                    Coinbase Native
                  </h3>
                  <p className="text-xs text-[var(--app-foreground-muted)]">
                    Wallet-to-wallet
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
                    HD Quality
                  </h3>
                  <p className="text-xs text-[var(--app-foreground-muted)]">
                    Crystal clear
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
