'use client'

import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, FIND_CELO_ABI } from '@/src/constants'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FIND_CELO_ABI,
    functionName: 'getLeaderboard',
  })

  return (
    <main className="flex min-h-screen flex-col items-center p-12 text-white">
        <div className="max-w-3xl w-full">
            <Link href="/" className="text-blue-400 hover:underline mb-8 flex items-center">
                <ArrowLeft className="mr-2" size={20} /> Back to Home
            </Link>

            <h1 className="text-4xl font-bold mb-8 flex items-center">
                <Trophy className="mr-4 text-yellow-400" size={40} /> Global Leaderboard
            </h1>

            <div className="bg-white/10 rounded-xl overflow-hidden border border-white/20">
                <table className="w-full text-left">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Rank</th>
                            <th className="px-6 py-4 font-semibold">Explorer</th>
                            <th className="px-6 py-4 font-semibold text-right">XP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center opacity-50">Loading leaderboard...</td>
                            </tr>
                        ) : leaderboard && (leaderboard as any).length > 0 ? (
                            (leaderboard as any[]).map((address, index) => (
                                <tr key={address} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`
                                            inline-flex items-center justify-center w-8 height-8 rounded-full font-bold
                                            ${index === 0 ? 'bg-yellow-400 text-black' :
                                              index === 1 ? 'bg-gray-300 text-black' :
                                              index === 2 ? 'bg-orange-500 text-black' : 'bg-white/10'}
                                        `}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm">
                                        {address.slice(0, 6)}...{address.slice(-4)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-yellow-400">
                                        {/* Since we can't easily fetch all XPs in one call from contract without a multicall or additional helper,
                                            we might want to just show the address or have the contract return a struct.
                                            For now, we'll just show the address as the ranking itself is based on XP.
                                        */}
                                        -
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center opacity-50">The island is empty... for now.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </main>
  )
}
