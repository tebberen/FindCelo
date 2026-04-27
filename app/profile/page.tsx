'use client'

import { useAccount, useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, FIND_CELO_ABI } from '@/src/constants'
import { formatEther } from 'viem'
import Link from 'next/link'
import { ArrowLeft, Copy, Share2, Shield, Sword, Anchor, Coins, Trophy } from 'lucide-react'
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
    const url = `${window.location.origin}/api?ref=${address}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isConnected) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground font-sans text-center">
            <Shield className="w-20 h-20 text-muted mb-8" />
            <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter">Your stats are locked</h1>
            <p className="text-muted-foreground mb-8 max-w-xs">Connect your captain's wallet to reveal your journey's progress.</p>
            <Link href="/" className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform">
                Back to Island
            </Link>
        </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-background text-foreground font-sans">
        <div className="max-w-3xl w-full space-y-8">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors mb-8 flex items-center gap-2 font-bold text-sm uppercase tracking-widest">
                <ArrowLeft size={18} /> Back to Island
            </Link>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-border">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-card border-2 border-primary/30 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                   <span className="text-4xl relative z-10">📜</span>
                </div>
                <div>
                  <h1 className="text-4xl font-black italic tracking-tighter text-primary">Captain's Log</h1>
                  <p className="font-mono text-xs text-muted-foreground">{address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">Verified Voyager</span>
              </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20 text-4xl">
                  🧭
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
                                <span className="text-3xl">📦</span>
                                <span className="text-[8px] font-bold text-muted-foreground animate-pulse uppercase">Click to open</span>
                              </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-card/80 rounded-[32px] p-8 border-2 border-border backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute -right-20 -bottom-20 opacity-[0.05] rotate-12">
                           <Sword size={240} />
                        </div>

                        <h3 className="text-xl font-black italic tracking-tighter mb-6 flex items-center gap-3">
                            <Share2 className="text-primary" size={24} /> RECRUIT NEW VOYAGERS
                        </h3>

                        <div className="space-y-4 relative z-10">
                          <p className="text-sm text-muted-foreground max-w-md">
                            Expand your crew. Earn <span className="text-primary font-bold">5 XP</span> for every new explorer you bring to the island!
                          </p>

                          <div className="flex bg-background/40 rounded-2xl p-4 items-center border-2 border-border group">
                              <code className="text-[10px] font-mono break-all flex-1 text-muted-foreground">
                                  {typeof window !== 'undefined' ? `${window.location.origin}/api?ref=${address}` : ''}
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
                        <p className="text-4xl font-black text-primary">
                           {Number(formatEther((profile as any).totalCELOWon)).toFixed(2)} CELO 📦
                        </p>
                    </div>

                    {/* Achievements placeholder */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-card/30 p-6 rounded-2xl border-2 border-border flex items-center gap-4 opacity-50">
                          <span className="text-3xl">🏆</span>
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
                  <span className="text-5xl block mb-6">⚔️</span>
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
