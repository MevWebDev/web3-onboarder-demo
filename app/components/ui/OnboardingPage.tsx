import CryptoOnboardingFlow from '../CryptoOnboardingFlow';
import { useAccount } from 'wagmi';
import { Button, Card } from '../DemoComponents';

interface OnboardingPageProps {
  setter: (step: 'welcome' | 'connect' | 'onboarding' | 'home') => void;
}

export default function OnboardingPage({ setter }: OnboardingPageProps) {
  const { address, isConnected } = useAccount();

  return (
    <div className="h-full flex flex-col flex-1 w-[90%] items-center justify-center">
      <CryptoOnboardingFlow
        walletAddress={address}
        isConnected={isConnected}
        onComplete={() => setter('home')}
      />
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setter('connect')}>
        ← Back
      </Button>
    </div>
  );
}
