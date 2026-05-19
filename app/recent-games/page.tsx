'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ArrowLeft, Trophy, Skull, Calendar, MapPin, Coins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function RecentGames() {
  const { address, isConnected } = useAccount()
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (address) {
      const historyKey = `gameHistory_${address.toLowerCase()}`;
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory))
        } catch (e) {
          console.error('Failed to parse history', e)
        }
      }
    }
  }, [address])

  if (!isConnected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0a0a0a] text-foreground font-sans text-center">
        <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter text-primary">History Hidden</h1>
        <p className="text-muted-foreground mb-8 max-w-xs">Connect your wallet to reveal your past voyages.</p>
        <Link href="/" className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform">
          Back to Island
        </Link>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-[#0a0a0a] text-foreground font-sans">
      <div className="max-w-[600px] w-full space-y-8">
        <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors mb-8 flex items-center gap-2 font-bold text-sm uppercase tracking-widest">
          <ArrowLeft size={18} /> Back to Profile
        </Link>

        <div className="pb-8 border-b border-border">
          <h1 className="text-4xl font-black italic tracking-tighter text-primary">Recent Voyages</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Your journey through Treasure Island</p>
        </div>

        <div className="space-y-4">
          {history.length > 0 ? (
            history.map((game, index) => (
              <Card key={game.gameId || index} className="bg-card border-2 border-border overflow-hidden hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${game.didWin ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {game.didWin ? <Trophy size={24} /> : <Skull size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={game.didWin ? "default" : "destructive"} className="text-[10px] uppercase font-black px-2">
                            {game.didWin ? 'WIN' : 'LOSS'}
                          </Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {game.tableIndex === 0 ? '1 CELO' : game.tableIndex === 1 ? '5 CELO' : '10 CELO'} Table
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(game.timestamp).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} /> Land #{game.winningLand}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-black italic tracking-tighter ${game.didWin ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {game.didWin ? `+${game.prizeWon}` : '0'} <span className="text-xs uppercase">CELO</span>
                      </p>
                      <Link href={`https://celoscan.io/tx/${game.gameId}`} target="_blank" className="text-[9px] font-bold text-primary hover:underline uppercase tracking-tighter">
                        View Details
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-card rounded-[32px] border-2 border-dashed border-border">
              <p className="text-muted-foreground font-bold uppercase tracking-widest">No voyages recorded yet</p>
              <Link href="/" className="mt-4 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform inline-block">
                Start Playing
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
