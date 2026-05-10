import { createConfig, http } from 'wagmi';
import { celo } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [celo],
  connectors: [
    farcasterMiniApp(),
    injected(),
  ],
  transports: {
    [celo.id]: http(),
  },
  ssr: true,
});
