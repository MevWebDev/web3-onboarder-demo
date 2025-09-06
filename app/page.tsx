'use client';

import { useMiniKit, useAddFrame, useOpenUrl } from '@coinbase/onchainkit/minikit';
import { Name, Identity, Address, Avatar, EthBalance } from '@coinbase/onchainkit/identity';

import { useAccount } from 'wagmi';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { Button, Icon, Card } from './components/DemoComponents';
import CryptoOnboardingFlow from './components/CryptoOnboardingFlow';

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { address, isConnected } = useAccount();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  // Use a single step state for flow
  const [step, setStep] = useState<'welcome' | 'connect' | 'onboarding' | 'home'>('home');
  const [isMentor, setIsMentor] = useState(false);

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
        <main className="flex-1 space-y-6">
          {step === 'welcome' && (
            <Card className="text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
                  <span className="text-white text-2xl">🚀</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--app-foreground)] mb-2">
                    Welcome to Web3-Onboarder
                  </h2>
                  <p className="text-[var(--app-foreground-muted)] text-sm leading-relaxed">
                    Find your perfect crypto mentor and make wallet-to-wallet video calls.
                  </p>
                  <Button className="mt-4" onClick={() => setStep('connect')}>
                    Get Started
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {step === 'connect' && (
            <Card title="Step 1: Connect Your Wallet">
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
                  Your wallet address will be your unique identifier
                </p>
                {isConnected && (
                  <Button className="w-full" onClick={() => setStep('onboarding')}>
                    Continue
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setStep('welcome')}
                >
                  ← Back
                </Button>
              </div>
            </Card>
          )}

          {step === 'onboarding' && (
            <Card title="Step 2: Find Your Mentor">
              <CryptoOnboardingFlow
                walletAddress={address}
                isConnected={isConnected}
                onComplete={() => setStep('home')}
              />
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setStep('connect')}>
                ← Back
              </Button>
            </Card>
          )}

          {step === 'home' && <Card>Home</Card>}
        </main>

        <footer className="mt-6 pt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl('https://base.org/builders/minikit')}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}
