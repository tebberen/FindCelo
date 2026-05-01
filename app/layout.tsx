import type { Metadata } from 'next'
import { Inter, Pirata_One } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { FarcasterSDKLoader } from '@/components/FarcasterSDKLoader'

const inter = Inter({ subsets: ['latin'] })
const pirata = Pirata_One({ subsets: ['latin'], weight: '400', variable: '--font-pirata' })

export const metadata: Metadata = {
  title: 'FindCelo - Treasure Island',
  description: "Find the treasure on Celo's Treasure Island. 6 lands, 1 winner. Play now!",
  openGraph: {
    title: 'FindCelo - Treasure Island',
    description: "Find the treasure on Celo's Treasure Island. 6 lands, 1 winner. Play now!",
    images: ['https://find-celo.vercel.app/images/background.png'],
  },
  alternates: {
    types: {
      'application/vnd.farcaster.snap+json': 'https://find-celo.vercel.app/api/snap',
    },
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://find-celo.vercel.app/images/background.png',
    'fc:frame:post_url': 'https://find-celo.vercel.app/api/frame',
    'fc:frame:button:1': '1 CELO',
    'fc:frame:button:2': '5 CELO',
    'fc:frame:button:3': '10 CELO',
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
