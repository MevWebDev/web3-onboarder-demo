'use client';

import { type ReactNode } from 'react';
import { base, baseSepolia } from 'viem/chains';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
// import { StreamVideoProvider } from "./StreamClientProvider";

export function Providers(props: { children: ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={baseSepolia}
      config={{
        appearance: {
          mode: 'auto',
          theme: 'mini-app-theme',
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
    >
      {props.children}
    </MiniKitProvider>
  );
}
