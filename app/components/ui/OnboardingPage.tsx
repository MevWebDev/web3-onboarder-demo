import CryptoOnboardingFlow from '../CryptoOnboardingFlow';
import { useAccount } from 'wagmi';
import { Button, Card } from '../DemoComponents';

interface OnboardingPageProps {
  setter: (step: 'welcome' | 'connect' | 'onboarding' | 'home') => void;
}

export default function OnboardingPage({ setter }: OnboardingPageProps) {
  const { address, isConnected } = useAccount();

  return (
    <Card title="Step 2: Find Your Mentor">
      <CryptoOnboardingFlow
        walletAddress={address}
        isConnected={isConnected}
        onComplete={() => setter('home')}
      />
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setter('connect')}>
        ← Back
      </Button>
    </Card>
  );
}
