'use client'

import { useState, useEffect, useMemo } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Map, Trophy, User, Share2, MapPin, Skull, Coins, Timer, HelpCircle, Landmark } from 'lucide-react'
import Link from 'next/link'
import { CONTRACT_ADDRESS, FIND_CELO_ABI, TABLE_TYPES, TABLE_COSTS } from '@/src/constants'

export default function Home() {
  const { isConnected, address } = useAccount()
  const [selectedTable, setSelectedTable] = useState('BRONZE')

  const tableIndex = (TABLE_TYPES as any)[selectedTable]
  const tableCost = (TABLE_COSTS as any)[tableIndex]

  // Contract Reads
  const { data: tablePlayers, refetch: refetchPlayers } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FIND_CELO_ABI,
    functionName: 'getTablePlayers',
    args: [tableIndex],
  })

  const { data: tableInfo, refetch: refetchTableInfo } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FIND_CELO_ABI,
    functionName: 'tables',
    args: [tableIndex],
  })

  const { data: hash, writeContract, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  useEffect(() => {
    if (isConfirmed) {
      refetchPlayers()
      refetchTableInfo()
    }
  }, [isConfirmed, refetchPlayers, refetchTableInfo])

  const handleJoinGame = (land: number) => {
    if (!isConnected) return

    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FIND_CELO_ABI,
      functionName: 'joinGame',
      args: [BigInt(land), '0x0000000000000000000000000000000000000000', tableIndex],
      value: parseEther(tableCost),
    })
  }

  const seatsFilled = tableInfo ? (tableInfo as any).seatsFilled : 0
  const potSize = Number(tableCost) * seatsFilled
  const totalPot = Number(tableCost) * 6
  const winnerPrize = (totalPot * 5) / 6

  const playersList = useMemo(() => {
    if (!tablePlayers) return []
    return (tablePlayers as any).slice(1, 7)
  }, [tablePlayers])

  const userPosition = playersList.findIndex((p: string) => p.toLowerCase() === address?.toLowerCase()) + 1

  // Static list of recent winners as per design requirement (3-5 winners)
  // In a real app, these would come from events/indexing
  const recentWinners = [
    { address: '0x71C...4e21', amount: '8.33', date: '2m ago' },
    { address: '0x3A2...9b10', amount: '41.67', date: '15m ago' },
    { address: '0xF4e...11a2', amount: '0.83', date: '1h ago' },
  ]

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 text-white font-sans selection:bg-amber-500/30">
      {/* Top Section - Stats Bar */}
      <div className="w-full bg-slate-900/50 border-b border-white/5 py-3 px-4 md:px-8 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Est. Prize:</span>
            <span className="text-xs font-bold text-amber-400">{winnerPrize} CELO</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Timer className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Seats: {seatsFilled}/6</span>
          </div>
        </div>
        <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
      </div>

      <div className="flex flex-col items-center max-w-4xl w-full px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-12 text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-glow-gold flex items-center justify-center gap-3">
            🏝️ <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">FINDCELO - HAZINE ADASI</span> 🏝️
          </h1>
          <div className="inline-block px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
             <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-500/70 tracking-[0.2em]">Current Table Pot</span>
                <span className="text-4xl font-black text-amber-400 tracking-tighter">{potSize} <span className="text-lg">CELO</span></span>
             </div>
          </div>
        </div>

        {/* 6-Land Game Table */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12 w-full max-w-2xl relative">
          {/* Decorative elements */}
          <div className="absolute -inset-4 bg-amber-500/5 rounded-[40px] blur-3xl -z-10 animate-pulse"></div>

          {[1, 2, 3, 4, 5, 6].map((land) => {
            const playerAddress = tablePlayers ? (tablePlayers as any)[land] : '0x0000000000000000000000000000000000000000'
            const isOccupied = playerAddress !== '0x0000000000000000000000000000000000000000'
            const isUser = address && playerAddress.toLowerCase() === address.toLowerCase()

            return (
              <button
                key={land}
                onClick={() => !isOccupied && handleJoinGame(land)}
                disabled={!isConnected || isPending || isConfirming || !!isOccupied}
                className={`
                  relative h-40 rounded-3xl flex flex-col items-center justify-center
                  transition-all duration-300 group overflow-hidden
                  ${!isOccupied
                    ? 'bg-slate-900 border-2 border-amber-500/30 hover:border-amber-400 glow-gold-hover cursor-pointer active:scale-95'
                    : isUser
                      ? 'bg-amber-500/20 border-2 border-amber-500 glow-gold shadow-amber-500/20 cursor-default'
                      : 'bg-slate-900/50 border-2 border-red-500/20 cursor-default'}
                `}
              >
                {/* Background Pattern */}
                {!isOccupied && (
                   <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                      <Landmark className="w-full h-full p-4 rotate-12" />
                   </div>
                )}

                {isOccupied ? (
                  <>
                    <Skull className={`w-10 h-10 mb-2 ${isUser ? 'text-amber-400' : 'text-red-500/50'} animate-float`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isUser ? 'text-amber-400' : 'text-slate-500'}`}>
                       {isUser ? 'YOUR TERRITORY' : 'FILLED'}
                    </span>
                    <span className="text-[9px] font-mono mt-1 opacity-40">
                       {playerAddress.slice(0, 6)}...{playerAddress.slice(-4)}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 mb-2 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      {isPending || isConfirming ? (
                        <Timer className="w-6 h-6 text-amber-400 animate-spin" />
                      ) : (
                        <MapPin className="w-6 h-6 text-amber-400 group-hover:-translate-y-1 transition-transform" />
                      )}
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">
                      LAND {land}
                    </span>
                    <span className="text-[10px] font-bold text-amber-500/60 mt-1">EMPTY</span>
                  </>
                )}

                {/* Connection check for non-connected users */}
                {!isConnected && !isOccupied && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-[1px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black uppercase tracking-tighter bg-amber-500 text-slate-950 px-3 py-1 rounded-full">Connect Wallet</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Bottom Section - Selection & Status */}
        <div className="w-full max-w-2xl bg-slate-900/80 border border-white/5 rounded-[32px] p-6 md:p-8 space-y-8 backdrop-blur-xl">

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Select Table</span>
               <div className="flex gap-3">
                {Object.keys(TABLE_TYPES).map((table) => (
                  <button
                    key={table}
                    onClick={() => setSelectedTable(table)}
                    className={`px-6 py-3 rounded-2xl font-black transition-all duration-300 text-sm ${
                      selectedTable === table
                      ? 'bg-amber-500 text-slate-950 scale-105 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750 border border-white/5'
                    }`}
                  >
                    {(TABLE_COSTS as any)[(TABLE_TYPES as any)[table]]} <span className="text-[10px] ml-1">CELO</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end text-center md:text-right">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</span>
              <div className="h-10 flex items-center">
                {seatsFilled < 6 ? (
                   <div className="flex items-center gap-2 text-amber-400 font-bold animate-pulse">
                      <Timer className="w-4 h-4" />
                      <span>Waiting for {6 - seatsFilled} more players</span>
                   </div>
                ) : (
                  <div className="text-green-500 font-bold flex items-center gap-2">
                     <HelpCircle className="w-4 h-4 animate-bounce" />
                     <span>Revealing Winner...</span>
                  </div>
                )}
              </div>
              {userPosition > 0 && (
                <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mt-1">
                  You are at Land {userPosition}
                </span>
              )}
            </div>
          </div>

          {/* Action Messages */}
          {(isPending || isConfirming || isConfirmed) && (
            <div className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all animate-in fade-in zoom-in duration-300 ${
              isConfirmed ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {isPending && <><Timer className="w-5 h-5 animate-spin" /> <span className="font-bold">Preparing your voyage...</span></>}
              {isConfirming && <><Timer className="w-5 h-5 animate-spin" /> <span className="font-bold">Searching for treasure...</span></>}
              {isConfirmed && <><Trophy className="w-5 h-5 animate-bounce" /> <span className="font-bold text-glow-gold">Land claimed! May the tides be in your favor.</span></>}
            </div>
          )}

          {/* Navigation & Recent Winners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quick Navigation</span>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/leaderboard" className="flex items-center gap-2 p-3 bg-slate-800 hover:bg-slate-750 border border-white/5 rounded-xl text-xs font-bold transition-all">
                  <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard
                </Link>
                <Link href="/profile" className="flex items-center gap-2 p-3 bg-slate-800 hover:bg-slate-750 border border-white/5 rounded-xl text-xs font-bold transition-all">
                  <User className="w-4 h-4 text-amber-400" /> My Captain
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Winners</span>
              <div className="space-y-2">
                {recentWinners.map((winner, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                       <span className="text-[10px] font-mono text-slate-400">{winner.address}</span>
                    </div>
                    <div className="text-right">
                       <span className="block text-[10px] font-bold text-amber-400">WON {winner.amount} CELO</span>
                       <span className="block text-[8px] text-slate-500">{winner.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex justify-between items-center pt-4 border-t border-white/5">
             <div className="flex items-center gap-4 text-slate-500 text-[10px] font-bold">
                <Link href="/api" className="hover:text-amber-500 transition-colors uppercase tracking-widest">Play Frame</Link>
                <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
                <a href="#" className="hover:text-amber-500 transition-colors uppercase tracking-widest">How to play</a>
             </div>
             <div className="flex items-center gap-2">
                <Share2 className="w-3 h-3 text-slate-500" />
                <span className="text-[9px] font-bold text-slate-500 uppercase">Share Journey</span>
             </div>
          </div>
        </div>
      </div>
    </main>
  )
}
