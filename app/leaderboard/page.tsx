'use client'

import { useState, useEffect } from 'react'
import { useReadContract, usePublicClient } from 'wagmi'
import { CONTRACT_ADDRESS, FIND_CELO_ABI } from '@/src/constants'
import { formatEther } from 'viem'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Leaderboard() {
  const [recentWinners, setRecentWinners] = useState<any[]>([])
  const publicClient = usePublicClient()

  const { data: leaderboard, isLoading: isLeaderboardLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FIND_CELO_ABI,
    functionName: 'getLeaderboard',
  })

  useEffect(() => {
    const fetchWinners = async () => {
      if (!publicClient) return
      try {
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS as `0x${string}`,
          event: FIND_CELO_ABI.find((x: any) => x.name === 'TableFilled') as any,
          fromBlock: BigInt(0),
          toBlock: 'latest',
        })

        const formattedWinners = logs.reverse().slice(0, 10).map((log: any) => ({
          address: log.args.winner,
          amount: formatEther(log.args.prize),
          tableType: log.args.tableType === 0 ? 'BRONZE' : log.args.tableType === 1 ? 'SILVER' : 'GOLD',
          land: Number(log.args.winningLand),
          roundId: log.blockNumber.toString().slice(-5)
        }))
        setRecentWinners(formattedWinners)
      } catch (e) {
        console.error('Error fetching winners:', e)
      }
    }
    fetchWinners()
  }, [publicClient])

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-[#302624] text-foreground font-sans">
        <div className="max-w-[600px] w-full space-y-8">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors mb-8 flex items-center gap-2 font-bold text-sm uppercase tracking-widest">
                <ArrowLeft size={18} /> Back to Island
            </Link>

            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-primary flex items-center justify-center gap-4">
                  Global Hall of Fame
              </h1>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-xs">The Greatest Explorers of FindCelo</p>
            </div>

            {/* LEADERBOARD SECTION */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    🏆 Global Leaderboard
                </h2>
                <div className="bg-black/40 backdrop-blur-sm rounded-[32px] overflow-hidden border-2 border-white/10 shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b-2 border-white/10">
                                <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Rank</th>
                                <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Explorer</th>
                                <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground text-right">Reputation (XP)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-white/10">
                            {isLeaderboardLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs animate-pulse">Consulting the maps...</span>
                                    </div>
                                    </td>
                                </tr>
                            ) : leaderboard && (leaderboard as any).length > 0 ? (
                                (leaderboard as any[]).map((address, index) => (
                                    <tr key={address} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className={`
                                                inline-flex items-center justify-center w-10 h-10 rounded-xl font-black
                                                ${index === 0 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' :
                                                index === 1 ? 'bg-muted text-muted-foreground' :
                                                index === 2 ? 'bg-amber-700/50 text-white' : 'bg-muted/50 text-muted-foreground'}
                                            `}>
                                                {index === 0 ? '👑' : index + 1}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 min-w-0">
                                            <div className="flex flex-col min-w-0">
                                            <span className="font-mono text-sm group-hover:text-primary transition-colors truncate">
                                                {address.slice(0, 4)}...{address.slice(-4)}
                                            </span>
                                            {index === 0 && <span className="text-[10px] font-bold text-primary uppercase tracking-tighter truncate">Island Sovereign</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-xl font-black text-primary">
                                                -
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                        <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs">The island is empty... for now.</span>
                                    </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RECENT WINNERS SECTION */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    👑 Recent Winners
                </h2>
                <div className="bg-black/40 backdrop-blur-sm rounded-[32px] overflow-hidden border-2 border-white/10 shadow-2xl divide-y-2 divide-white/10">
                    {recentWinners.length > 0 ? (
                        recentWinners.map((winner, i) => (
                            <div key={i} className="px-8 py-6 flex items-center justify-between hover:bg-primary/5 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-nowrap">
                                            <span className="text-sm font-mono font-bold truncate">
                                                {winner.address.slice(0, 4)}...{winner.address.slice(-4)}
                                            </span>
                                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/20 text-primary shrink-0">
                                                {winner.tableType}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground block mt-1 truncate">
                                            Won at Land #{winner.land} • Round #{winner.roundId}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-primary">+{winner.amount} CELO</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                                <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                                    The island is quiet... for now.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-primary/5 border-2 border-primary/10 rounded-2xl p-6 text-center">
               <p className="text-muted-foreground text-sm italic">"Only those who dare to sail the roughest seas will find the greatest treasures."</p>
            </div>
        </div>
    </main>
  )
}
