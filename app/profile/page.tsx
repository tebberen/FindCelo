'use client'

import { useAccount, useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, FIND_CELO_ABI } from '@/src/constants'
import { formatEther } from 'viem'
import Link from 'next/link'
import { ArrowLeft, Copy, Share2 } from 'lucide-react'
import { useState } from 'react'

export default function Profile() {
  const { address, isConnected } = useAccount()
  const [copied, setCopied] = useState(false)

  const { data: profile, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FIND_CELO_ABI,
    functionName: 'getUserProfile',
    args: [address],
    query: {
        enabled: !!address
    }
  })

  const copyReferral = () => {
    if (!address) return
    const url = `${window.location.origin}/api?ref=${address}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isConnected) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
            <h1 className="text-4xl font-bold mb-8 text-white">Connect your wallet to see your stats</h1>
            <Link href="/" className="text-blue-400 hover:underline flex items-center">
                <ArrowLeft className="mr-2" size={20} /> Back to Home
            </Link>
        </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-12 text-white">
        <div className="max-w-2xl w-full">
            <Link href="/" className="text-blue-400 hover:underline mb-8 flex items-center">
                <ArrowLeft className="mr-2" size={20} /> Back to Home
            </Link>

            <h1 className="text-4xl font-bold mb-8">Your Profile</h1>

            {isLoading ? (
                <p>Loading stats...</p>
            ) : profile ? (
                <div className="bg-white/10 rounded-xl p-8 border border-white/20">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-sm opacity-60">Total Games</p>
                            <p className="text-3xl font-bold">{(profile as any).totalGames.toString()}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-60">Total Wins</p>
                            <p className="text-3xl font-bold text-green-400">{(profile as any).totalWins.toString()}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-60">Total XP</p>
                            <p className="text-3xl font-bold text-yellow-400">{(profile as any).totalXP.toString()}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-60">CELO Won</p>
                            <p className="text-3xl font-bold text-blue-400">{formatEther((profile as any).totalCELOWon)}</p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8">
                        <h3 className="text-xl font-bold mb-4 flex items-center">
                            <Share2 className="mr-2" size={20} /> Your Referral Link
                        </h3>
                        <div className="flex bg-black/20 rounded-lg p-3 items-center">
                            <code className="text-xs break-all flex-1">
                                {typeof window !== 'undefined' ? `${window.location.origin}/api?ref=${address}` : ''}
                            </code>
                            <button
                                onClick={copyReferral}
                                className="ml-4 p-2 hover:bg-white/10 rounded-md transition-colors"
                            >
                                {copied ? <span className="text-xs text-green-400">Copied!</span> : <Copy size={18} />}
                            </button>
                        </div>
                        <p className="text-xs opacity-50 mt-2">Earn 5 XP for every new explorer you bring to the island!</p>
                    </div>
                </div>
            ) : (
                <p>No profile found. Play a game to start your journey!</p>
            )}
        </div>
    </main>
  )
}
