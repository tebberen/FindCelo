import type { Metadata } from 'next'
import { Inter, Pirata_One } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { FarcasterSDKLoader } from '@/components/FarcasterSDKLoader'

const inter = Inter({ subsets: ['latin'] })
const pirata = Pirata_One({ subsets: ['latin'], weight: '400', variable: '--font-pirata' })

export const metadata: Metadata = {
  title: 'FindCelo - Treasure Island Game',
  description: '6 lands, 1 treasure, winner takes 5x CELO. Play now!',
  openGraph: {
    title: 'FindCelo - Treasure Island Game',
    description: '6 lands, 1 treasure, winner takes 5x CELO. Play now!',
    images: ['https://find-celo.vercel.app/images/Find%20Celo.png'],
  },
  alternates: {
    types: {
      'application/vnd.farcaster.snap+json': 'https://find-celo.vercel.app/api/snap',
    },
  },
  other: {
    'og:image': 'https://find-celo.vercel.app/images/Find%20Celo.png',
    'fc:frame:image': 'https://find-celo.vercel.app/images/Find%20Celo.png',
    'og:title': 'FindCelo - Treasure Island Game',
    'og:description': '6 lands, 1 treasure, winner takes 5x CELO. Play now!',
    'fc:frame': 'vNext',
    'fc:frame:button:1': '🏝️ Play FindCelo',
    'fc:frame:button:1:action': 'launch_frame',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${pirata.variable}`}>
        <FarcasterSDKLoader />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
