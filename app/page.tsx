import Link from 'next/link'
import { Map, Trophy, User, Share2 } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-12">
        <h1 className="text-6xl font-bold mb-4">🏝️ FindCelo 🏝️</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        <Link href="/api" className="group rounded-lg border border-orange-500/20 bg-white/10 px-5 py-4 transition-colors hover:border-orange-500 hover:bg-white/20">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            <Map className="inline-block mr-2" /> Play Frame{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Open the game in Farcaster and find the treasure!
          </p>
        </Link>

        <Link href="/leaderboard" className="group rounded-lg border border-orange-500/20 bg-white/10 px-5 py-4 transition-colors hover:border-orange-500 hover:bg-white/20">
          <h2 className={`mb-3 text-2xl font-semibold text-orange-900`}>
            <Trophy className="inline-block mr-2" /> Leaderboard{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            See who is the best treasure hunter on Celo.
          </p>
        </Link>

        <Link href="/profile" className="group rounded-lg border border-orange-500/20 bg-white/10 px-5 py-4 transition-colors hover:border-orange-500 hover:bg-white/20">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            <User className="inline-block mr-2" /> Profile{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Check your stats and XP.
          </p>
        </Link>

        <div className="group rounded-lg border border-orange-500/20 bg-white/10 px-5 py-4 transition-colors hover:border-orange-500 hover:bg-white/20">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            <Share2 className="inline-block mr-2" /> Referrals
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Share your link and get 5 XP for every new player.
          </p>
        </div>
      </div>
    </main>
  )
}
