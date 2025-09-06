import { Card, Button } from '../DemoComponents';
import { useAccount } from 'wagmi';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';

import { Name, Identity, Address, Avatar, EthBalance } from '@coinbase/onchainkit/identity';

interface ConnectPageProps {
  setter: (step: 'welcome' | 'connect' | 'onboarding' | 'home') => void;
}

export default function ConnectPage({ setter }: ConnectPageProps) {
  // Get wallet connection status
  const { isConnected } = useAccount();

  return (
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
          <Button className="w-full" onClick={() => setter('onboarding')}>
            Continue
          </Button>
        )}
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setter('welcome')}>
          ← Back
        </Button>
      </div>
    </Card>
  );
}
