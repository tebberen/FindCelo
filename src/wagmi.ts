import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celo } from 'wagmi/chains';
import { http } from 'wagmi';

// MiniPay uses standard window.ethereum, which is supported by the default injected provider in RainbowKit
export const config = getDefaultConfig({
  appName: 'FindCelo',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || '3fbb6b1f28fc4896a71d188899dfbd8e', // Fallback to a default if not provided
  chains: [celo],
  transports: {
    [celo.id]: http(),
  },
  ssr: true,
});
