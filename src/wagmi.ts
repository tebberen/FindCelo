import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celo } from 'wagmi/chains';
import { http } from 'wagmi';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '3fbb6b1f28fc4896a71d188899dfbd8e';

export const config = getDefaultConfig({
  appName: 'FindCelo',
  projectId,
  chains: [celo],
  // @ts-ignore - farcasterMiniApp connector is not yet in RainbowKit's type definitions
  connectors: [miniAppConnector()],
  transports: {
    [celo.id]: http(),
  },
  ssr: true,
});
