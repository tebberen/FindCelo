import type { Metadata } from 'next'
import { Inter, Pirata_One } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })
const pirata = Pirata_One({ subsets: ['latin'], weight: '400', variable: '--font-pirata' })

export const metadata: Metadata = {
  title: '🪮 FINDCELO - 🏝️ Treasure Island',
  description: 'A game on Celo blockchain',
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
