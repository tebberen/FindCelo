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
    images: ['https://find-celo.vercel.app/images/logo.png'],
  },
  alternates: {
    types: {
      'application/vnd.farcaster.snap+json': 'https://find-celo.vercel.app/api/snap',
    },
  },
  other: {
    'og:image': 'https://find-celo.vercel.app/images/logo.png',
    'fc:frame:image': 'https://find-celo.vercel.app/images/logo.png',
    'og:title': 'FindCelo - Treasure Island Game',
    'og:description': '6 lands, 1 treasure, winner takes 5x CELO. Play now!',
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: 'https://find-celo.vercel.app/images/logo.png',
      iconUrl: 'https://find-celo.vercel.app/images/logo.png',
      splashImageUrl: 'https://find-celo.vercel.app/images/logo.png',
      splashBackgroundColor: '#3e2722',
      button: {
        title: '🏝️ Play FindCelo',
        action: {
          type: 'launch_miniapp',
          url: 'https://find-celo.vercel.app',
          name: 'FindCelo',
        },
      },
    }),
    'fc:frame': JSON.stringify({
      version: '1',
      imageUrl: 'https://find-celo.vercel.app/images/logo.png',
      iconUrl: 'https://find-celo.vercel.app/images/logo.png',
      button: {
        title: '🏝️ Play FindCelo',
        action: {
          type: 'launch_frame',
          url: 'https://find-celo.vercel.app',
          name: 'FindCelo',
        },
      },
    }),
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
