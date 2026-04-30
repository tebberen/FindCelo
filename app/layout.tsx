import type { Metadata } from 'next'
import { Inter, Pirata_One } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })
const pirata = Pirata_One({ subsets: ['latin'], weight: '400', variable: '--font-pirata' })

export const metadata: Metadata = {
  title: '🪮 FINDCELO - 🏝️ Treasure Island',
  description: 'A game on Celo blockchain',
  other: {
    "of:accepts:xmtp": "2024-02-01",
    "fc:frame": "1",
    "fc:frame:image": "https://find-celo.vercel.app/images/background.png",
    "fc:frame:button:1": "Play FindCelo",
    "fc:frame:post_url": "https://find-celo.vercel.app/api/frame",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
