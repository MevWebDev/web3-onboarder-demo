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
import { UserButton } from "@civic/auth/react";

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
                <UserButton />
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
                    Explore Base ecosystem
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400">
                    3
                  </div>
                  <span className="text-sm text-[var(--app-foreground-muted)]">
                    Start your Web3 journey
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
