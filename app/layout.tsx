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
    images: ['https://find-celo.vercel.app/images/logo.png?v=4'],
  },
  alternates: {
    types: {
      'application/vnd.farcaster.snap+json': 'https://find-celo.vercel.app/api/snap',
    },
  },
  other: {
    'og:image': 'https://find-celo.vercel.app/images/logo.png?v=4',
    'fc:frame:image': 'https://find-celo.vercel.app/images/logo.png?v=4',
    'og:title': 'FindCelo - Treasure Island Game',
    'og:description': '6 lands, 1 treasure, winner takes 5x CELO. Play now!',
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: 'https://find-celo.vercel.app/images/logo.png?v=4',
      iconUrl: 'https://find-celo.vercel.app/images/logo.png?v=4',
      splashImageUrl: 'https://find-celo.vercel.app/images/logo.png?v=4',
      splashBackgroundColor: '#3e2722',
      button: {
        title: 'Play Game',
        action: {
          type: 'launch_miniapp',
          url: 'https://find-celo.vercel.app',
          name: 'FindCelo',
        },
      },
    }),
    'fc:frame': JSON.stringify({
      version: "2.0",
      theme: {
        accent: "#FCFF52"
      },
      ui: {
        root: "main",
        elements: {
          main: {
            type: "stack",
            props: {
              direction: "vertical",
              gap: "md",
              align: "center"
            },
            children: ["banner", "title", "tier_row", "land_label", "land_row_1", "land_row_2"]
          },
          banner: {
            type: "image",
            props: {
              src: "https://find-celo.vercel.app/images/logo.png?v=4",
              aspectRatio: "1:1"
            }
          },
          title: {
            type: "text",
            props: {
              content: "🏝️ FindCelo Treasure Island",
              weight: "bold",
              size: "lg",
              align: "center"
            }
          },
          tier_row: {
            type: "stack",
            props: {
              direction: "horizontal",
              gap: "sm"
            },
            children: ["btn_tier_0", "btn_tier_1", "btn_tier_2"]
          },
          btn_tier_0: {
            type: "button",
            props: { label: "1 CELO", variant: "primary" },
            on: { press: { action: "open_mini_app", params: { target: "https://find-celo.vercel.app/?tier=0" } } }
          },
          btn_tier_1: {
            type: "button",
            props: { label: "5 CELO", variant: "primary" },
            on: { press: { action: "open_mini_app", params: { target: "https://find-celo.vercel.app/?tier=1" } } }
          },
          btn_tier_2: {
            type: "button",
            props: { label: "10 CELO", variant: "primary" },
            on: { press: { action: "open_mini_app", params: { target: "https://find-celo.vercel.app/?tier=2" } } }
          },
          land_label: {
            type: "text",
            props: {
              content: "Select a Land:",
              weight: "bold",
              size: "md"
            }
          },
          land_row_1: {
            type: "stack",
            props: {
              direction: "horizontal",
              gap: "sm"
            },
            children: ["btn_land_1", "btn_land_2", "btn_land_3"]
          },
          btn_land_1: {
            type: "button",
            props: { label: "LAND 1" },
            on: { press: { action: "open_mini_app", params: { target: "https://find-celo.vercel.app/?land=1" } } }
          },
          btn_land_2: {
            type: "button",
            props: { label: "LAND 2" },
            on: { press: { action: "open_mini_app", params: { target: "https://find-celo.vercel.app/?land=2" } } }
          },
          btn_land_3: {
            type: "button",
            props: { label: "LAND 3" },
            on: { press: { action: "open_mini_app", params: { target: "https://find-celo.vercel.app/?land=3" } } }
          },
          land_row_2: {
            type: "stack",
            props: {
              direction: "horizontal",
              gap: "sm"
            },
            children: ["btn_land_4", "btn_land_5", "btn_land_6"]
          },
          btn_land_4: {
            type: "button",
            props: { label: "LAND 4" },
            on: { press: { action: "open_mini_app", params: { target: "https://find-celo.vercel.app/?land=4" } } }
          },
          btn_land_5: {
            type: "button",
            props: { label: "LAND 5" },
            on: { press: { action: "open_mini_app", params: { target: "https://find-celo.vercel.app/?land=5" } } }
          },
          btn_land_6: {
            type: "button",
            props: { label: "LAND 6" },
            on: { press: { action: "open_mini_app", params: { target: "https://find-celo.vercel.app/?land=6" } } }
          }
        }
      }
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
