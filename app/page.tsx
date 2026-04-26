'use client'

import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { Map, Trophy, User, Share2, Compass, MapPin, Skull } from 'lucide-react'
import Link from 'next/link'
import { CONTRACT_ADDRESS, FIND_CELO_ABI, TABLE_TYPES, TABLE_COSTS } from '@/src/constants'

export default function Home() {
  const { isConnected, address } = useAccount()
  const [selectedTable, setSelectedTable] = useState('BRONZE')
  const [selectedLand, setSelectedLand] = useState<number | null>(null)

  const tableIndex = (TABLE_TYPES as any)[selectedTable]

  const { data: tablePlayers, refetch: refetchPlayers } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FIND_CELO_ABI,
    functionName: 'getTablePlayers',
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
    }
  }, [isConfirmed, refetchPlayers])

  const handleJoinGame = (land: number) => {
    if (!isConnected) return

    const tableIndex = (TABLE_TYPES as any)[selectedTable]
    const cost = (TABLE_COSTS as any)[tableIndex]

    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FIND_CELO_ABI,
      functionName: 'joinGame',
      args: [BigInt(land), '0x0000000000000000000000000000000000000000', tableIndex],
      value: parseEther(cost),
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-[#fbbf24] text-[#1e3a8a]">
      {/* Header */}
      <div className="z-10 w-full max-w-5xl flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold italic tracking-tighter">🏝️ FindCelo</h1>
        <ConnectButton />
      </div>

      <div className="flex flex-col items-center max-w-4xl w-full">
        <div className="mb-8 text-center">
          <h2 className="text-5xl font-black mb-4 uppercase drop-shadow-lg">Treasure Island</h2>
          <p className="text-lg font-semibold opacity-80">Choose your table, pick a land, and find the CELO treasure!</p>
        </div>

        {/* Table Selection */}
        <div className="flex gap-4 mb-8">
          {Object.keys(TABLE_TYPES).map((table) => (
            <button
              key={table}
              onClick={() => setSelectedTable(table)}
              className={`px-6 py-2 rounded-full font-bold transition-all ${
                selectedTable === table
                ? 'bg-[#ea580c] text-white scale-110 shadow-lg'
                : 'bg-white/30 hover:bg-white/50'
              }`}
            >
              {(TABLE_COSTS as any)[(TABLE_TYPES as any)[table]]} CELO
            </button>
          ))}
        </div>

        {/* 6-Land Game Table */}
        <div className="grid grid-cols-3 gap-4 mb-12 p-8 bg-[#fef3c7] rounded-3xl border-8 border-dashed border-[#d97706]/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d97706 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          {[1, 2, 3, 4, 5, 6].map((land) => {
            const isOccupied = !!(tablePlayers && (tablePlayers as any)[land] !== '0x0000000000000000000000000000000000000000')

            return (
              <button
                key={land}
                onClick={() => !isOccupied && handleJoinGame(land)}
                disabled={!isConnected || isPending || isConfirming || !!isOccupied}
                className={`
                  group relative w-32 h-32 md:w-40 md:h-40 rounded-2xl flex flex-col items-center justify-center
                  transition-all transform hover:scale-105 active:scale-95
                  ${isConnected && !isOccupied
                    ? 'bg-[#fbbf24] hover:bg-[#f59e0b] cursor-pointer'
                    : isOccupied
                      ? 'bg-[#ea580c] text-white cursor-not-allowed'
                      : 'bg-gray-300 cursor-not-allowed opacity-50'}
                  border-b-8 border-r-8 ${isOccupied ? 'border-[#9a3412]' : 'border-[#d97706]'}
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]
                `}
              >
                {isOccupied ? (
                  <Skull className="w-12 h-12 mb-2 animate-pulse text-white/90" />
                ) : (
                  <MapPin className={`w-12 h-12 mb-2 ${isPending || isConfirming ? 'animate-spin' : 'group-hover:-translate-y-2 transition-transform duration-300'}`} />
                )}
                <span className="text-xl font-black uppercase tracking-tighter">
                  {isOccupied ? 'FILLED' : `LAND ${land}`}
                </span>
                {!isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                    <span className="text-xs font-bold uppercase rotate-12 bg-red-500 text-white px-2 py-1">Connect</span>
                  </div>
                )}
                {isOccupied && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full rotate-12 border-2 border-white">
                    OCCUPIED
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Status Messages */}
        <div className="h-24 flex items-center justify-center w-full mb-4">
          {(isPending || isConfirming) && (
            <div className="p-4 bg-[#ea580c] text-white rounded-2xl font-bold animate-pulse shadow-lg border-2 border-white/20">
              {isPending ? '📜 Preparing your voyage...' : '🧭 Searching for treasure...'}
            </div>
          )}

          {isConfirmed && (
            <div className="p-4 bg-green-600 text-white rounded-2xl font-bold animate-bounce shadow-lg border-2 border-white/20">
              🏴‍☠️ Land claimed! May the tides be in your favor.
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <Link href="/api" className="flex items-center justify-center gap-2 p-4 bg-white/20 rounded-xl font-bold hover:bg-white/40 transition-all">
            <Map className="w-5 h-5" /> Play Frame
          </Link>
          <Link href="/leaderboard" className="flex items-center justify-center gap-2 p-4 bg-white/20 rounded-xl font-bold hover:bg-white/40 transition-all">
            <Trophy className="w-5 h-5" /> Scores
          </Link>
          <Link href="/profile" className="flex items-center justify-center gap-2 p-4 bg-white/20 rounded-xl font-bold hover:bg-white/40 transition-all">
            <User className="w-5 h-5" /> Profile
          </Link>
          <div className="flex items-center justify-center gap-2 p-4 bg-white/20 rounded-xl font-bold cursor-help">
            <Share2 className="w-5 h-5" /> Share
          </div>
        </div>
      </div>
    </main>
  )
}
