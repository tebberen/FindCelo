'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { Map, Trophy, User, Share2, Compass } from 'lucide-react'
import Link from 'next/link'
import { CONTRACT_ADDRESS, FIND_CELO_ABI, TABLE_TYPES, TABLE_COSTS } from '@/src/constants'

export default function Home() {
  const { isConnected, address } = useAccount()
  const [selectedTable, setSelectedTable] = useState('BRONZE')
  const [selectedLand, setSelectedLand] = useState<number | null>(null)

  const { data: hash, writeContract, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

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
              {table} ({(TABLE_COSTS as any)[(TABLE_TYPES as any)[table]]} CELO)
            </button>
          ))}
        </div>

        {/* 6-Land Game Table */}
        <div className="grid grid-cols-3 gap-4 mb-12 p-6 bg-[#1e3a8a]/10 rounded-3xl border-4 border-[#ea580c]/30 shadow-2xl">
          {[1, 2, 3, 4, 5, 6].map((land) => (
            <button
              key={land}
              onClick={() => handleJoinGame(land)}
              disabled={!isConnected || isPending || isConfirming}
              className={`
                group relative w-32 h-32 md:w-40 md:h-40 rounded-2xl flex flex-col items-center justify-center
                transition-all transform hover:scale-105 active:scale-95
                ${isConnected
                  ? 'bg-[#fcd34d] hover:bg-[#fbbf24] cursor-pointer'
                  : 'bg-gray-300 cursor-not-allowed opacity-50'}
                border-b-8 border-r-8 border-[#d97706]
              `}
            >
              <Compass className={`w-12 h-12 mb-2 ${isPending || isConfirming ? 'animate-spin' : 'group-hover:rotate-45 transition-transform'}`} />
              <span className="text-xl font-black">LAND {land}</span>
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                  <span className="text-xs font-bold uppercase rotate-12 bg-red-500 text-white px-2 py-1">Connect Wallet</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Status Messages */}
        {(isPending || isConfirming) && (
          <div className="mb-8 p-4 bg-white/20 rounded-xl font-bold animate-pulse">
            {isPending ? 'Confirming in wallet...' : 'Searching for treasure on the blockchain...'}
          </div>
        )}

        {isConfirmed && (
          <div className="mb-8 p-4 bg-green-500 text-white rounded-xl font-bold animate-bounce">
            🏴‍☠️ Land joined! Check the Frame for results.
          </div>
        )}

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
