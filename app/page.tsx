'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient, useConnect } from 'wagmi'
import { parseEther, formatEther, decodeEventLog } from 'viem'
import Link from 'next/link'
import { sdk } from '@farcaster/miniapp-sdk'
import type { Context } from '@farcaster/miniapp-core'
import { CONTRACT_ADDRESS, FIND_CELO_ABI, TABLE_TYPES, TABLE_COSTS } from '@/src/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function Home() {
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const [selectedTable, setSelectedTable] = useState('BRONZE')
  const [isMiniPay, setIsMiniPay] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<Context.UserContext | null>(null)
  const [showShareJoin, setShowShareJoin] = useState(false)
  const [showShareWin, setShowShareWin] = useState(false)
  const [lastJoinedLand, setLastJoinedLand] = useState<number | null>(null)
  const [lastWinAmount, setLastWinAmount] = useState<string | null>(null)
  const [lastProcessedWinnerRound, setLastProcessedWinnerRound] = useState<string | null>(null)
  const [lastCastedHash, setLastCastedHash] = useState<string | null>(null)

  // Detect MiniPay and Farcaster
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum?.isMiniPay) {
      setIsMiniPay(true)
    }

    const loadFarcaster = async () => {
      const context = await sdk.context
      if (context?.user) {
        setFarcasterUser(context.user)
      }
    }
    loadFarcaster()
  }, [])

  // Auto-connect
  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      if (isMiniPay) {
        const injectedConnector = connectors.find(c => c.id === 'injected')
        if (injectedConnector) {
          connect({ connector: injectedConnector })
        }
      } else {
        const farcasterConnector = connectors.find(c => c.id === 'farcasterMiniApp')
        if (farcasterConnector) {
          connect({ connector: farcasterConnector })
        }
      }
    }
  }, [isMiniPay, isConnected, connect, connectors])
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

  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  useEffect(() => {
    if (isConfirmed && receipt && hash && hash !== lastCastedHash) {
      setLastCastedHash(hash)

      const triggerAutoCast = async () => {
        try {
          // Need latest table state for accurate seatsFilled
          const { data: latestTableInfo } = await refetchTableInfo()
          refetchPlayers()

          let currentFilled = 0
          if (latestTableInfo) {
             if (typeof latestTableInfo === 'object') {
               currentFilled = Number((latestTableInfo as any).seatsFilled || 0)
             } else {
               currentFilled = Number(latestTableInfo)
             }
          }

          // Check for TableFilled event
          const tableFilledLog = receipt.logs.find(log => {
            try {
              const decoded = decodeEventLog({
                abi: FIND_CELO_ABI,
                data: log.data,
                topics: log.topics,
              })
              return decoded.eventName === 'TableFilled'
            } catch {
              return false
            }
          })

          let text = ''
          const username = farcasterUser?.username ? `@${farcasterUser.username}` : (address?.slice(0, 4) + '...' + address?.slice(-4))

          if (tableFilledLog) {
            const decoded = decodeEventLog({
              abi: FIND_CELO_ABI,
              data: tableFilledLog.data,
              topics: tableFilledLog.topics,
            }) as any

            const winner = decoded.args.winner
            const prize = formatEther(decoded.args.prize)
            const winnerLand = Number(decoded.args.winningLand)
            const winnerUsername = winner.toLowerCase() === address?.toLowerCase()
              ? (farcasterUser?.username ? `@${farcasterUser.username}` : winner.slice(0, 4) + '...' + winner.slice(-4))
              : winner.slice(0, 4) + '...' + winner.slice(-4)

            text = `🎉 TREASURE FOUND! 🎉\n\n${winnerUsername} won ${prize} CELO! 🤑\nThe treasure was hidden in Land ${winnerLand}.\n\nCongratulations! 🎊 A new round has started. Try your luck:\n👇 https://find-celo.vercel.app\n\n#FindCelo #Celo #TreasureIsland`
          } else {
            const filledCount = currentFilled
            const emptyCount = 6 - filledCount

            text = `⚔️ Adventurer ${username} has set foot on Treasure Island! ⚔️\n\n🏝️ They claimed Land ${lastJoinedLand}.\n\nNow ${filledCount}/6 players are on the island. ${emptyCount} more adventurers needed to find the treasure!\n\nJoin the hunt: 👇\nhttps://find-celo.vercel.app\n\n#FindCelo #Celo #TreasureIsland`
          }

          await sdk.actions.composeCast({
            text,
            embeds: ['https://find-celo.vercel.app']
          })
        } catch (error) {
          console.error('Error triggering auto-cast:', error)
          setShowShareJoin(true)
        }
      }

      triggerAutoCast()
    }
  }, [isConfirmed, receipt, hash, lastCastedHash, refetchPlayers, refetchTableInfo, farcasterUser, address, lastJoinedLand])

  // Monitor for wins
  useEffect(() => {
    if (recentWinners.length > 0 && address) {
      const latestWinner = recentWinners[0]
      if (
        latestWinner.address.toLowerCase() === address.toLowerCase() &&
        latestWinner.roundId !== lastProcessedWinnerRound
      ) {
        setLastWinAmount(latestWinner.amount)
        setShowShareWin(true)
        setShowShareJoin(false) // Win takes precedence
        setLastProcessedWinnerRound(latestWinner.roundId)
      }
    }
  }, [recentWinners, address, lastProcessedWinnerRound])

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
    setLastJoinedLand(land)
    setShowShareJoin(false)
    setShowShareWin(false)

    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FIND_CELO_ABI,
      functionName: 'joinGame',
      args: [BigInt(land), '0x0000000000000000000000000000000000000000', tableIndex],
      value: parseEther(tableCost),
    })
  }

  const handleShareJoin = async () => {
    const username = farcasterUser?.username ? `@${farcasterUser.username}` : (address?.slice(0, 4) + '...' + address?.slice(-4))
    const filledCount = seatsFilled
    const emptyCount = 6 - filledCount
    const text = `⚔️ Adventurer ${username} has set foot on Treasure Island! ⚔️\n\n🏝️ They claimed Land ${lastJoinedLand}.\n\nNow ${filledCount}/6 players are on the island. ${emptyCount} more adventurers needed to find the treasure!\n\nJoin the hunt: 👇\nhttps://find-celo.vercel.app\n\n#FindCelo #Celo #TreasureIsland`

    try {
      await sdk.actions.composeCast({
        text,
        embeds: ['https://find-celo.vercel.app']
      })
      setShowShareJoin(false)
    } catch (error) {
      console.error('Error sharing join:', error)
    }
  }

  const handleShareWin = async () => {
    const winnerUsername = farcasterUser?.username ? `@${farcasterUser.username}` : address?.slice(0, 4) + '...' + address?.slice(-4)
    const text = `🎉 TREASURE FOUND! 🎉\n\n${winnerUsername} won ${lastWinAmount} CELO! 🤑\n\nCongratulations! 🎊 A new round has started. Try your luck:\n👇 https://find-celo.vercel.app\n\n#FindCelo #Celo #TreasureIsland`

    try {
      await sdk.actions.composeCast({
        text,
        embeds: ['https://find-celo.vercel.app']
      })
      setShowShareWin(false)
    } catch (error) {
      console.error('Error sharing win:', error)
    }
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
    <main className="min-h-screen bg-transparent flex items-start justify-center p-0 text-foreground font-sans selection:bg-primary/30">
      <div
        className="w-full max-w-[500px] rounded-[24px] overflow-hidden relative shadow-2xl bg-card bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat [image-rendering:crisp-edges] [image-rendering:-webkit-optimize-contrast]"
      >
        <div className="space-y-2 pt-3 px-3 pb-48 relative z-10">

        {/* TOP SECTION */}
        <div className="sticky top-0 z-20 flex justify-between items-center bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 flex-nowrap gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden shrink-0 min-w-0">
            <Badge variant="destructive" className="animate-pulse flex gap-1 items-center px-1.5 py-0.5 uppercase tracking-wider text-[9px] font-bold shrink-0">
              Live
            </Badge>
            {isMiniPay && (
              <Badge variant="outline" className="flex gap-1 items-center px-1.5 py-0.5 uppercase tracking-wider text-[9px] font-bold border-yellow-500/50 text-yellow-500 bg-yellow-500/10 shrink-0">
                MiniPay
              </Badge>
            )}
            <span className="text-[9px] font-bold text-white uppercase tracking-wider shrink-0">
              R#{(tableIndex * 1000 + (seatsFilled || 0)).toString().padStart(5, '0')}
            </span>

            <Button asChild variant="ghost" size="sm" className="h-6 gap-0.5 px-1 text-white hover:bg-white/10 border border-white/5 bg-white/5 shrink-0">
              <Link href="/leaderboard">
                <span>🏆</span>
                <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider">Leader</span>
              </Link>
            </Button>

            <Button asChild variant="ghost" size="sm" className="h-6 gap-0.5 px-1 text-white hover:bg-white/10 border border-white/5 bg-white/5 shrink-0">
              <Link href="/profile">
                <span>👤</span>
                <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider">Profile</span>
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
            {isConnected && farcasterUser && (
              <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/10 min-w-0">
                <img
                  src={farcasterUser.pfpUrl}
                  alt={farcasterUser.username}
                  className="w-4 h-4 rounded-full border border-primary/50 shrink-0"
                />
                <span className="text-[9px] font-bold text-white uppercase tracking-wider truncate max-w-[70px]">
                  @{farcasterUser.username}
                </span>
              </div>
            )}
            {isConnected && !farcasterUser && (
              <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/10 min-w-0">
                <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-[8px] shrink-0">
                  👤
                </div>
                <span className="text-[9px] font-bold text-white uppercase tracking-wider truncate max-w-[70px]">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </div>
            )}
            {!isConnected && (
              <Button
                onClick={() => {
                  const connector = isMiniPay
                    ? connectors.find(c => c.id === 'injected')
                    : connectors.find(c => c.id === 'farcasterMiniApp');
                  if (connector) connect({ connector });
                }}
                variant="default"
                size="sm"
                className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider shrink-0"
              >
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="flex justify-center mb-1">
          <h1 className="font-pirata text-3xl whitespace-nowrap tracking-widest bg-black/60 backdrop-blur-md px-8 py-3 rounded-2xl text-[#FFD700] [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] border border-white/10">
            ✦ Treasure Island ✦
          </h1>
        </div>

        {/* TABLE SELECTION */}
        <div className="flex gap-3 my-1">
          {Object.keys(TABLE_TYPES).map((table) => {
            const isActive = selectedTable === table
            return (
              <Button
                key={table}
                variant={isActive ? "default" : "outline"}
                onClick={() => setSelectedTable(table)}
                className={`flex-1 h-12 font-bold transition-all border-2 backdrop-blur-md ${
                  isActive ? "shadow-lg shadow-primary/20 bg-primary/80" : "text-muted-foreground bg-card/40"
                }`}
              >
                {(TABLE_COSTS as any)[(TABLE_TYPES as any)[table]]} CELO
              </Button>
            )
          })}
        </div>

        {/* POT CARD */}
        <Card className="border-border bg-card/60 backdrop-blur-md overflow-hidden relative border-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="p-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Current Pot 💰</CardDescription>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-4xl font-black">{potSize} <span className="text-sm font-bold text-muted-foreground">CELO</span></span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{seatsFilled} / 6 players</span>
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(seatsFilled / 6) * 100}%` }}
                  ></div>
                </div>
                <Badge variant="outline" className="text-accent border-accent/20 bg-accent/5 text-[10px]">
                  {6 - seatsFilled} slots left
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="bg-muted/50 rounded-xl p-3 flex items-center justify-center gap-2 border border-border/50">
               <span className="text-sm">👑</span>
               <span className="text-xs font-medium">
                  Est. Winner Prize: <span className="font-bold text-primary">{winnerPrize} CELO</span>
               </span>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-border/50" />

        {/* STATUS MESSAGE */}
        <div className="flex flex-col gap-3 my-1">
          <div className="text-center h-auto flex items-center justify-center bg-black/60 backdrop-blur-md rounded-xl px-6 py-3 border border-white/10 shadow-xl">
             {userLand > 0 ? (
                <p className="text-sm font-bold text-white">
                   You're in land <span className="text-yellow-400 font-black">#{userLand}</span> — waiting for <span className="text-yellow-400 font-black">{6 - seatsFilled}</span> more
                </p>
             ) : (
                <p className="text-sm font-bold text-white/80 flex gap-1.5 items-center">
                  Select a land to join the voyage
                </p>
             )}
          </div>

          {(showShareJoin || showShareWin) && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <Button
                onClick={showShareWin ? handleShareWin : handleShareJoin}
                className="w-full h-12 font-black uppercase tracking-widest bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-none shadow-lg shadow-blue-500/20 group"
              >
                {showShareWin ? (
                  <span className="flex items-center gap-2">
                    🎉 Share Win to Farcaster
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    📢 Arkadaşını Davet Et
                  </span>
                )}
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </div>
          )}
        </div>

        {/* LAND GRID */}
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6].map((land) => {
            const playerAddress = tablePlayers ? (tablePlayers as any)[land] : '0x0000000000000000000000000000000000000000'
            const isOccupied = playerAddress !== '0x0000000000000000000000000000000000000000'
            const isUser = address && playerAddress.toLowerCase() === address.toLowerCase()

            return (
              <Card
                key={land}
                className={`
                  relative aspect-[4/5] flex flex-col items-center justify-center p-4
                  transition-all duration-200 cursor-pointer group border-2
                  ${!isOccupied
                    ? 'hover:border-primary/50 bg-black/50 backdrop-blur-sm border-amber-500/30'
                    : isUser
                      ? 'border-primary ring-1 ring-primary/20 bg-black/60 backdrop-blur-sm'
                      : 'opacity-60 bg-black/40 backdrop-blur-sm border-white/10'}
                `}
                onClick={() => !isOccupied && handleJoinGame(land)}
              >
                <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${
                    isOccupied
                        ? (isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')
                        : 'bg-secondary/50'
                }`}>
                   <img src="/images/treasure-chest.png" alt="Land" className="w-10 h-10" />
                </div>
                <span className="text-[14px] font-bold uppercase text-yellow-200 block w-full truncate text-center">
                   {land}
                </span>
                <span className="text-[11px] font-bold uppercase text-yellow-200/80 block w-full truncate text-center">
                   {isOccupied ? (isUser ? (farcasterUser ? `@${farcasterUser.username}` : 'YOU') : `${playerAddress.slice(0, 4)}...${playerAddress.slice(-4)}`) : 'EMPTY'}
                </span>

                {isConfirming && !isOccupied && (
                   <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                   </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* RECENT WINNERS */}
        <div className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 px-1">
                👑 Recent Winners
            </h2>
            <div className="bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl divide-y divide-white/5">
                {recentWinners.length > 0 ? (
                    recentWinners.slice(0, 3).map((winner, i) => (
                        <div key={i} className="px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-nowrap">
                                        <span className="text-[10px] font-mono font-bold text-white truncate">
                                            {winner.address.slice(0, 4)}...{winner.address.slice(-4)}
                                        </span>
                                        <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/20 text-primary shrink-0 h-3.5 uppercase font-black">
                                            {winner.tableType}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-black text-[#FFD700]">+{winner.amount} CELO</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-3 py-4 text-center">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                            The island is quiet...
                        </span>
                    </div>
                )}
            </div>
        </div>

        {/* FOOTER */}
        <footer className="w-full p-4 flex justify-center">
          <p className="text-sm font-bold text-[#FFD700] text-center">Built on Celo</p>
        </footer>
        </div>
      </div>
    </main>
  )
}
