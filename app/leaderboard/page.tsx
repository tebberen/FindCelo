'use client'

import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, FIND_CELO_ABI } from '@/src/constants'
import Link from 'next/link'
import { ArrowLeft, Trophy, Crown, Anchor, Compass } from 'lucide-react'

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FIND_CELO_ABI,
    functionName: 'getLeaderboard',
  })

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-slate-950 text-white font-sans">
        <div className="max-w-3xl w-full space-y-8">
            <Link href="/" className="text-slate-400 hover:text-amber-400 transition-colors mb-8 flex items-center gap-2 font-bold text-sm uppercase tracking-widest">
                <ArrowLeft size={18} /> Back to Island
            </Link>

            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-glow-gold flex items-center justify-center gap-4">
                  <Trophy className="text-amber-400" size={48} /> Global Hall of Fame
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">The Greatest Explorers of FindCelo</p>
            </div>

            <div className="bg-slate-900/50 rounded-[32px] overflow-hidden border border-white/5 backdrop-blur-xl shadow-2xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 border-b border-white/5">
                            <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-slate-500">Rank</th>
                            <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-slate-500">Explorer</th>
                            <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-slate-500 text-right">Reputation (XP)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="px-8 py-20 text-center">
                                  <div className="flex flex-col items-center gap-4">
                                    <Compass className="text-amber-500 animate-spin" size={40} />
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Consulting the maps...</span>
                                  </div>
                                </td>
                            </tr>
                        ) : leaderboard && (leaderboard as any).length > 0 ? (
                            (leaderboard as any[]).map((address, index) => (
                                <tr key={address} className="hover:bg-amber-500/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className={`
                                            inline-flex items-center justify-center w-10 h-10 rounded-xl font-black
                                            ${index === 0 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' :
                                              index === 1 ? 'bg-slate-300 text-slate-950' :
                                              index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}
                                        `}>
                                            {index === 0 ? <Crown size={16} /> : index + 1}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                          <span className="font-mono text-sm group-hover:text-amber-400 transition-colors">
                                            {address.slice(0, 10)}...{address.slice(-8)}
                                          </span>
                                          {index === 0 && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Island Sovereign</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className="text-xl font-black text-amber-400">
                                            -
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-8 py-20 text-center">
                                  <div className="flex flex-col items-center gap-4 opacity-30">
                                    <Anchor size={48} />
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">The island is empty... for now.</span>
                                  </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 text-center">
               <p className="text-slate-400 text-sm italic">"Only those who dare to sail the roughest seas will find the greatest treasures."</p>
            </div>
        </div>
    </main>
  )
}
