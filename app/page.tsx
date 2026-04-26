'use client'

import { useState, useEffect, useMemo } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Trophy, Coins, ChevronDown, Activity } from 'lucide-react'
import Link from 'next/link'
import { CONTRACT_ADDRESS, FIND_CELO_ABI, TABLE_TYPES, TABLE_COSTS } from '@/src/constants'

export default function Home() {
  const { isConnected, address } = useAccount()
  const [selectedTable, setSelectedTable] = useState('BRONZE')
  const [recentWinners, setRecentWinners] = useState<any[]>([])
  const publicClient = usePublicClient()

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

  // Fetch Recent Winners from Events
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

        const formattedWinners = logs.reverse().slice(0, 5).map((log: any) => ({
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
  }, [publicClient, isConfirmed])

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

  const seatsFilled = useMemo(() => {
    if (tableInfo === undefined || tableInfo === null) return 0;
    if (typeof tableInfo === 'object') return Number((tableInfo as any).seatsFilled || 0);
    return Number(tableInfo);
  }, [tableInfo]);

  const potSize = Number(tableCost) * seatsFilled
  const totalPot = Number(tableCost) * 6
  const winnerPrize = (totalPot * 5) / 6

  const playersList = useMemo(() => {
    if (!tablePlayers) return []
    return (tablePlayers as any).slice(1, 7)
  }, [tablePlayers])

  const userLand = playersList.findIndex((p: string) => p.toLowerCase() === address?.toLowerCase()) + 1

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0a0a0a] text-white font-sans selection:bg-[#FFD700]/30">
      {/* TOP SECTION */}
      <div className="w-full max-w-xl px-4 pt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded">
            <Activity className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Live</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Round #{(tableIndex * 1000 + (seatsFilled || 0)).toString().padStart(5, '0')}
          </span>
        </div>
        <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
      </div>

      <div className="flex flex-col items-center max-w-xl w-full px-4 py-6">
        {/* MIDDLE SECTION */}
        <div className="text-center w-full">
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-[#FFD700] mb-8 mt-2">
            🏝️ FINDCELO TREASURE ISLAND 🏝️
          </h1>

          <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 w-full mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/5 blur-3xl rounded-full -mr-16 -mt-16"></div>

            <div className="flex justify-between items-start mb-4">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">POT</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-3xl font-black text-white">{potSize} <span className="text-sm text-slate-400">CELO</span></span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{seatsFilled} / 6 players</span>
                <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[#FFD700] transition-all duration-500"
                    style={{ width: `${(seatsFilled / 6) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-[#FF8C00] mt-1.5 block">{6 - seatsFilled} slots left</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 flex items-center justify-center gap-2">
               <Trophy className="w-4 h-4 text-[#FFD700]" />
               <span className="text-xs font-medium text-slate-300">
                  Est. Prize: <span className="font-bold text-[#FFD700]">{winnerPrize} CELO</span>
               </span>
            </div>
          </div>
        </div>

        {/* LAND SECTION */}
        <div className="grid grid-cols-3 gap-3 mb-8 w-full">
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
                  relative aspect-[4/5] rounded-2xl flex flex-col items-center justify-center
                  transition-all duration-200 border-2
                  ${!isOccupied
                    ? 'bg-[#111827] border-white/5 hover:border-[#FFD700]/40 active:scale-95'
                    : isUser
                      ? 'bg-[#111827] border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.05)]'
                      : 'bg-[#111827]/40 border-white/5 opacity-80'}
                `}
              >
                <div className={`w-10 h-10 rounded-full mb-3 flex items-center justify-center text-sm font-bold ${
                    isOccupied
                        ? (isUser ? 'bg-[#FFD700] text-black' : 'bg-slate-800 text-slate-400')
                        : 'bg-slate-800/50 text-[#FFD700]'
                }`}>
                   {land}
                </div>
                <span className="text-[10px] font-bold uppercase mb-1 text-slate-300">
                   LAND {land}
                </span>
                {isOccupied ? (
                   <span className="text-[8px] font-mono text-slate-500">
                      {isUser ? 'YOU' : `${playerAddress.slice(0, 6)}...${playerAddress.slice(-4)}`}
                   </span>
                ) : (
                   <span className="text-[8px] font-bold text-emerald-500 uppercase">Free</span>
                )}

                {isConfirming && !isOccupied && (
                   <div className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
                   </div>
                )}
              </button>
            )
          })}
        </div>

        {/* BOTTOM SECTION */}
        <div className="w-full space-y-6">
          {/* Table Selection */}
          <div className="flex gap-2 w-full">
            {Object.keys(TABLE_TYPES).map((table) => (
              <button
                key={table}
                onClick={() => setSelectedTable(table)}
                className={`flex-1 py-3.5 rounded-xl font-bold transition-all text-xs border ${
                  selectedTable === table
                  ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_4px_12px_rgba(255,215,0,0.2)]'
                  : 'bg-[#111827] text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
              >
                {(TABLE_COSTS as any)[(TABLE_TYPES as any)[table]]} CELO
              </button>
            ))}
          </div>

          {/* Status Message */}
          <div className="text-center py-2 h-10 flex items-center justify-center">
             {userLand > 0 ? (
                <p className="text-sm font-medium text-slate-300">
                   You're in land <span className="text-[#FFD700] font-bold">#{userLand}</span> — waiting for <span className="text-[#FFD700] font-bold">{6 - seatsFilled}</span> more
                </p>
             ) : (
                <p className="text-sm font-medium text-slate-400">Select a land to join the voyage</p>
             )}
          </div>

          {/* Recent Winners */}
          <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Rounds</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
            <div className="divide-y divide-white/5">
              {recentWinners.length > 0 ? (
                recentWinners.map((winner, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#FFD700]/10 text-[#FFD700]`}>
                        {winner.land}
                      </div>
                      <div>
                        <span className="text-xs font-mono text-slate-300">{winner.address.slice(0, 10)}...</span>
                        <span className="text-[10px] block text-slate-500">{winner.tableType} Table • Round #{winner.roundId}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-xs font-bold text-[#FFD700]">+{winner.amount} CELO</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-slate-500 text-xs italic">
                   Waiting for more treasures to be found...
                </div>
              )}
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex justify-center gap-6 pt-2">
             <Link href="/leaderboard" className="text-[10px] font-bold text-slate-500 hover:text-[#FFD700] transition-colors uppercase tracking-widest">Leaderboard</Link>
             <Link href="/profile" className="text-[10px] font-bold text-slate-500 hover:text-[#FFD700] transition-colors uppercase tracking-widest">Profile</Link>
             <Link href="/api" className="text-[10px] font-bold text-slate-500 hover:text-[#FFD700] transition-colors uppercase tracking-widest">Play Frame</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
