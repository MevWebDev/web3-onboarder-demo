'use client';

import { useMiniKit, useAddFrame, useOpenUrl } from '@coinbase/onchainkit/minikit';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { Button, Icon, Card } from './components/DemoComponents';

import HelloPage from './components/ui/HelloPage';
import ConnectPage from './components/ui/ConnectPage';
import OnboardingPage from './components/ui/OnboardingPage';

// import { NetworkChecker, ContractExistenceChecker } from './NetworkChecker';

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  // const { address, isConnected } = useAccount();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  // Use a single step state for flow
  const [step, setStep] = useState<'welcome' | 'connect' | 'onboarding' | 'home'>('welcome');
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
    <div className="flex flex-col items-center min-h-[100dvh] font-sans ">
      {step === 'welcome' && <HelloPage setter={setStep} />}

      {step === 'connect' && <ConnectPage setter={setStep} />}

      {step === 'onboarding' && <OnboardingPage setter={setStep} />}

      {step === 'home' && <Card>Home</Card>}
    </div>
  );
}
