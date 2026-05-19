'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, History, Trophy, Skull, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HistoryPage() {
  const { isConnected, address } = useAccount()
  const [gameHistory, setGameHistory] = useState<any[]>([])

  useEffect(() => {
    if (address) {
      const historyKey = `gameHistory_${address.toLowerCase()}`
      const saved = localStorage.getItem(historyKey)
      if (saved) {
        try {
          setGameHistory(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse history', e)
        }
      }
    }
  }, [address])

  return (
    <main className="min-h-screen bg-[#3e2722] bg-[url('/images/background.png')] bg-cover bg-center bg-fixed text-[#f4f4db] font-sans p-4">
      <div className="max-w-[500px] mx-auto space-y-6 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
          <Button asChild variant="ghost" size="sm" className="h-10 text-white hover:bg-white/10">
            <Link href="/">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-bold uppercase tracking-widest text-xs">Back</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h1 className="font-pirata text-2xl tracking-widest text-yellow-500">Game Voyage</h1>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Stats Summary */}
        {isConnected && gameHistory.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-black/60 border-white/10 backdrop-blur-md">
              <CardContent className="p-4 text-center space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total Games</p>
                <p className="text-2xl font-black text-white">{gameHistory.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-black/60 border-white/10 backdrop-blur-md">
              <CardContent className="p-4 text-center space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Wins</p>
                <p className="text-2xl font-black text-yellow-500">
                  {gameHistory.filter(g => g.didWin).length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* History List */}
        <div className="space-y-3">
          {!isConnected ? (
            <div className="text-center py-20 bg-black/40 backdrop-blur-sm rounded-3xl border border-white/10">
              <p className="text-sm font-bold uppercase tracking-widest opacity-60">Connect your wallet to see your voyage</p>
            </div>
          ) : gameHistory.length === 0 ? (
            <div className="text-center py-20 bg-black/40 backdrop-blur-sm rounded-3xl border border-white/10 space-y-4">
              <History className="w-12 h-12 mx-auto text-white/20" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-60">No games found in your history</p>
              <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold uppercase tracking-widest">
                <Link href="/">Start Your First Voyage</Link>
              </Button>
            </div>
          ) : (
            gameHistory.map((game, i) => (
              <motion.div
                key={game.gameId || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`overflow-hidden border-2 transition-all ${
                  game.didWin
                    ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                    : 'bg-black/60 border-white/10'
                }`}>
                  <CardContent className="p-0">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          game.didWin ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/40'
                        }`}>
                          {game.didWin ? <Trophy className="w-6 h-6" /> : <Skull className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-black text-lg ${game.didWin ? 'text-yellow-500' : 'text-white'}`}>
                              {game.didWin ? 'VICTORY' : 'DEFEAT'}
                            </h3>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold border-white/10 text-white/60">
                              {game.tableIndex === 0 ? 'BRONZE' : game.tableIndex === 1 ? 'SILVER' : 'GOLD'}
                            </Badge>
                          </div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            Land #{game.winningLand} • {new Date(game.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-primary">
                          <Coins className="w-3 h-3" />
                          <span className={`text-xl font-black ${game.didWin ? 'text-yellow-500' : 'text-white/40'}`}>
                            {game.didWin ? `+${game.prizeWon}` : `-${game.tableIndex === 0 ? '1' : game.tableIndex === 1 ? '5' : '10'}`}
                          </span>
                        </div>
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter truncate max-w-[80px]">
                          {game.gameId.slice(0, 10)}...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
