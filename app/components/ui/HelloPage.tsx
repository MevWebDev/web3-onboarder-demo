import { Card, Button } from '../DemoComponents';
import { useAccount } from 'wagmi';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';

import { Name, Identity, Address, Avatar, EthBalance } from '@coinbase/onchainkit/identity';
import { ReactNode } from 'react';
import { useEffect } from 'react';

interface HelloPageProps {
  setter: (step: 'welcome' | 'connect' | 'onboarding' | 'home') => void;
}

export default function HelloPage({ setter }: HelloPageProps) {
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      setter('onboarding');
    }
  }, [isConnected, setter]);

  return (
    <div className="flex flex-col flex-1 w-[90%] items-center mx-auto">
      <div className=" flex-1 flex-col  mx-auto from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 flex items-center justify-center">
        <h1 className="text-3xl font-bold text-[var(--app-foreground)] mb-4 text-center">
          Welcome to <span className="text-blue-600">34us</span>!
        </h1>
        <p className="text-[var(--app-foreground-muted)] text-center mb-6">
          Let me onboard you to the web3 world.
        </p>
      </div>

      <Wallet className="w-full flex flex-col ">
        <ConnectWallet
          text="Get Started"
          className="mb-8  w-full  py-4 rounded-3xl text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:from-blue-600 hover:to-purple-700 transition-all"
        ></ConnectWallet>
      </Wallet>
    </div>
  );
}
