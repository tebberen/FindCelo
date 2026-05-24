'use client'

import { useAccount, useReadContract } from 'wagmi'
import { sdk } from '@farcaster/miniapp-sdk'
import { CONTRACT_ADDRESS, FIND_CELO_ABI } from '@/src/constants'
import { formatEther } from 'viem'
import Link from 'next/link'
import { ArrowLeft, Copy } from 'lucide-react'
import { useState } from 'react'

export default function Profile() {
  const { address, isConnected } = useAccount()
  const [copied, setCopied] = useState(false)
  const [showBounty, setShowBounty] = useState(false)

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
    const url = `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }


  if (!isConnected) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0a0a0a] text-foreground font-sans text-center">
            <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter">Your stats are locked</h1>
            <p className="text-muted-foreground mb-8 max-w-xs">Connect your captain's wallet to reveal your journey's progress.</p>
            <Link href="/" className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform">
                Back to Island
            </Link>
        </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-[#0a0a0a] text-foreground font-sans">
        <div className="max-w-[600px] w-full space-y-8">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors mb-8 flex items-center gap-2 font-bold text-sm uppercase tracking-widest">
                <ArrowLeft size={18} /> Back to Island
            </Link>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-border">
              <div className="flex items-center gap-6 min-w-0">
                <div className="min-w-0">
                  <h1 className="text-4xl font-black italic tracking-tighter text-primary truncate">Captain's Log</h1>
                  <p className="font-mono text-xs text-muted-foreground truncate">{address?.slice(0, 4)}...{address?.slice(-4)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full shrink-0">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></div>
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap">Verified Voyager</span>
              </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20 text-4xl">
                </div>
            ) : profile ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card p-6 rounded-[24px] border-2 border-border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Voyages</p>
                            <p className="text-3xl font-black italic tracking-tighter">{(profile as any).totalGames.toString()}</p>
                        </div>
                        <div className="bg-card p-6 rounded-[24px] border-2 border-border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Victories</p>
                            <p className="text-3xl font-black text-emerald-500 italic tracking-tighter">{(profile as any).totalWins.toString()}</p>
                        </div>
                        <div className="bg-card p-6 rounded-[24px] border-2 border-border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Reputation</p>
                            <p className="text-3xl font-black text-primary italic tracking-tighter">{(profile as any).totalXP.toString()}</p>
                        </div>
                        <div
                          className="bg-card p-6 rounded-[24px] border-2 border-border cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => setShowBounty(!showBounty)}
                        >
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Bounty (CELO)</p>
                            {showBounty ? (
                              <p className="text-3xl font-black text-accent italic tracking-tighter animate-in zoom-in-95 duration-200">
                                {Number(formatEther((profile as any).totalCELOWon)).toFixed(2)}
                              </p>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[8px] font-bold text-muted-foreground animate-pulse uppercase">Click to reveal</span>
                              </div>
                            )}
                        </div>
                    </div>

                    <Link href="/recent-games" className="block">
                      <div className="bg-primary/10 border-2 border-primary/30 rounded-[24px] p-6 hover:bg-primary/20 transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">📜</span>
                            <div>
                              <p className="text-xl font-black italic tracking-tighter text-primary">Recent Voyages</p>
                              <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">View your complete game history</p>
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            →
                          </div>
                        </div>
                      </div>
                    </Link>

                    <div className="bg-card/80 rounded-[32px] p-8 border-2 border-border backdrop-blur-xl relative overflow-hidden">
                        <h3 className="text-xl font-black italic tracking-tighter mb-6 flex items-center gap-3">
                            RECRUIT NEW VOYAGERS
                        </h3>

                        <div className="space-y-4 relative z-10">
                          <p className="text-sm text-muted-foreground max-w-md">
                            Expand your crew. Earn <span className="text-primary font-bold">5 XP</span> for every new explorer you bring to the island!
                          </p>

                          <div className="flex bg-background/40 rounded-2xl p-4 items-center border-2 border-border group">
                              <code className="text-[10px] font-mono break-all flex-1 text-muted-foreground">
                                  {`https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo`}
                              </code>
                              <button
                                  onClick={copyReferral}
                                  className="ml-4 p-3 bg-primary text-primary-foreground rounded-xl hover:scale-105 transition-transform"
                              >
                                  {copied ? <span className="text-[10px] font-bold uppercase">Copied</span> : <Copy size={18} />}
                              </button>
                          </div>
                        </div>
                    </div>

                    <div className="bg-card p-8 rounded-[32px] border-2 border-border text-center">
                        <p className="text-2xl font-black italic tracking-tighter mb-2">💰 Total Treasure</p>
                        <div className="flex items-center justify-center gap-4">
                          <p className="text-4xl font-black text-primary">
                             {Number(formatEther((profile as any).totalCELOWon)).toFixed(2)} CELO
                          </p>
                        </div>
                    </div>

                    {/* Achievements placeholder */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-card/30 p-6 rounded-2xl border-2 border-border flex items-center gap-4 opacity-50">
                          <span className="text-3xl">👑</span>
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sovereign Award</p>
                            <p className="text-[10px] text-muted-foreground/60">Win 10 Gold Table games</p>
                          </div>
                       </div>
                       <div className="bg-card/30 p-6 rounded-2xl border-2 border-border flex items-center gap-4 opacity-50">
                          <span className="text-3xl">💰</span>
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Master Trader</p>
                            <p className="text-[10px] text-muted-foreground/60">Earn 100 total CELO</p>
                          </div>
                       </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-card rounded-[32px] border-2 border-dashed border-border">
                  <p className="text-muted-foreground font-bold uppercase tracking-widest mb-6">No profile found in the island records</p>
                  <Link href="/" className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform inline-block">
                      Start Your Journey
                  </Link>
                </div>
            )}
        </div>
    </main>
  )
}
