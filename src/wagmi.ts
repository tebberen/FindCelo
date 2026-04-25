import { http, createConfig } from 'wagmi'
import { celo } from 'wagmi/chains'

export const config = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(),
  },
})
