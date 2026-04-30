import type { Metadata } from 'next'
import { Inter, Pirata_One } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })
const pirata = Pirata_One({ subsets: ['latin'], weight: '400', variable: '--font-pirata' })

export const metadata = {
  title: 'FindCelo',
  description: 'Treasure Island game on Celo',
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://find-celo.vercel.app/images/background.png',
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:post_url': 'https://find-celo.vercel.app/api/frame',
    'fc:frame:button:1': 'Play Now',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://find-celo.vercel.app',
  }
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
