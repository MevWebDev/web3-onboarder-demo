'use client';

import { useState } from 'react';
import InterviewChat from './InterviewChat';
import MentorMatches from './MentorMatches';
import { logger } from '@/lib/logger/index';

type FlowState = 'waiting' | 'interview' | 'matches' | 'complete';

interface CryptoOnboardingFlowProps {
  walletAddress?: string;
  isConnected?: boolean;
}

export default function CryptoOnboardingFlow({ walletAddress, isConnected }: CryptoOnboardingFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>('waiting');
  const [profile, setProfile] = useState<any>(null);

  const handleInterviewComplete = (generatedProfile: any) => {
    logger.info('Interview completed', { profileId: generatedProfile.id });
    setProfile(generatedProfile);
    setFlowState('matches');
  };

  const handleStartInterview = () => {
    logger.info('Starting interview', { walletAddress });
    setFlowState('interview');
  };

  const handleStartOver = () => {
    setFlowState('waiting');
    setProfile(null);
  };

  // Show different content based on flow state
  if (flowState === 'interview') {
    return (
      <div className="w-full">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-[var(--app-foreground)] mb-2">
            Let's Find Your Perfect Crypto Mentor! 🚀
          </h2>
          <p className="text-sm text-[var(--app-foreground-muted)]">
            I'll ask you 5 quick questions to understand your crypto goals and match you with the best mentors.
          </p>
          {walletAddress && (
            <p className="text-xs text-[var(--app-foreground-muted)] mt-2">
              Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          )}
        </div>
        
        <InterviewChat 
          walletAddress={walletAddress} 
          onComplete={handleInterviewComplete}
        />
      </div>
    );
  }

  if (flowState === 'matches' && profile) {
    return (
      <div className="w-full">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-[var(--app-foreground)] mb-2">
            Your Perfect Mentor Matches! ✨
          </h2>
          <p className="text-sm text-[var(--app-foreground-muted)]">
            Based on your responses, here are the mentors that best match your crypto journey.
          </p>
          <button 
            onClick={handleStartOver}
            className="mt-2 text-sm text-[var(--app-accent)] hover:underline"
          >
            Start Over
          </button>
        </div>
        
        <MentorMatches profile={profile} />
      </div>
    );
  }

  // Default state - show wallet connection prompt or start interview button
  if (isConnected && walletAddress) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <span className="text-white text-2xl">🔮</span>
        </div>
        <h3 className="text-lg font-bold text-[var(--app-foreground)] mb-2">
          Ready to Find Your Crypto Mentor?
        </h3>
        <p className="text-sm text-[var(--app-foreground-muted)] mb-6">
          Let's start with a quick interview to understand your crypto goals
        </p>
        <button
          onClick={handleStartInterview}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-all"
        >
          Start Mentor Matching 🚀
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
        <span className="text-white text-2xl">🔮</span>
      </div>
      <h3 className="text-lg font-bold text-[var(--app-foreground)] mb-2">
        Connect Your Wallet to Begin
      </h3>
      <p className="text-sm text-[var(--app-foreground-muted)] mb-4">
        Connect your wallet above to start the AI-powered mentor matching process
      </p>
      <div className="text-sm text-[var(--app-foreground-muted)]">
        👆 Please connect your wallet above to begin
      </div>
    </div>
  );
}