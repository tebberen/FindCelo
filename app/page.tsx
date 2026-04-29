'use client'

import { useState, useEffect, useMemo } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient, useConnect } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import Link from 'next/link'
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

  // Detect MiniPay
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum?.isMiniPay) {
      setIsMiniPay(true)
    }
  }, [])

  // Auto-connect for MiniPay
  useEffect(() => {
    if (isMiniPay && !isConnected && connectors.length > 0) {
      const injectedConnector = connectors.find(c => c.id === 'injected')
      if (injectedConnector) {
        connect({ connector: injectedConnector })
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
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-foreground font-sans selection:bg-primary/30">
      <div
        className="w-full max-w-[500px] rounded-[24px] overflow-hidden relative shadow-2xl"
        style={{
          backgroundImage: "url('/images/background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="space-y-8 p-6 md:p-8 relative z-10">

        {/* TOP SECTION */}
        <div className="flex justify-between items-center bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="animate-pulse flex gap-1 items-center px-2 py-0.5 uppercase tracking-wider text-[10px] font-bold">
              Live
            </Badge>
            {isMiniPay && (
              <Badge variant="outline" className="flex gap-1 items-center px-2 py-0.5 uppercase tracking-wider text-[10px] font-bold border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
                MiniPay
              </Badge>
            )}
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
              Round #{(tableIndex * 1000 + (seatsFilled || 0)).toString().padStart(5, '0')}
            </span>
          </div>
          <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
        </div>

        {/* HEADER SECTION */}
        <h1 className="text-center text-2xl font-bold text-[#FFD700] mb-4">FIND CELO</h1>

        {/* TABLE SELECTION */}
        <div className="flex gap-3">
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
          <CardHeader className="pb-2">
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
          <CardContent>
            <div className="bg-muted/50 rounded-xl p-3 flex items-center justify-center gap-2 border border-border/50">
               <span className="text-sm">👑</span>
               <span className="text-xs font-medium">
                  Est. Winner Prize: <span className="font-bold text-primary">{winnerPrize} CELO</span>
               </span>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-border/50" />

        {/* LAND GRID */}
        <div className="grid grid-cols-3 gap-3">
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
                <span className="text-lg font-bold uppercase text-yellow-200 mb-1 flex items-center whitespace-nowrap">
                   {land} | {isOccupied ? (isUser ? 'YOU' : `${playerAddress.slice(0, 4)}...${playerAddress.slice(-4)}`) : 'EMPTY'}
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

        {/* STATUS MESSAGE */}
        <div className="text-center h-auto flex items-center justify-center bg-black/60 backdrop-blur-md rounded-xl px-6 py-3 border border-white/10 shadow-xl my-4">
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

        {/* RECENT WINNERS */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-md border-2">
          <CardHeader className="py-4 px-6 border-b border-border/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">👑 Recent Winners</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentWinners.length > 0 ? (
                recentWinners.map((winner, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold">{winner.address.slice(0, 6)}...{winner.address.slice(-4)}</span>
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/20 text-primary">{winner.tableType}</Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">Won at Land #{winner.land} • Round #{winner.roundId}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-sm font-black text-primary">+{winner.amount} CELO</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-white/90 text-sm italic font-medium">
                   The island is quiet... for now.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FOOTER */}
        <footer className="bg-black/60 backdrop-blur-md rounded-2xl p-6 w-full border border-white/10 mt-4 flex flex-col items-center gap-6 pt-4 pb-8">
          <div className="flex justify-center gap-8">
             <Link href="/leaderboard" className="text-sm font-bold text-white hover:text-yellow-400 transition-colors uppercase tracking-widest flex items-center gap-1.5">Leaderboard</Link>
             <Link href="/profile" className="text-sm font-bold text-white hover:text-yellow-400 transition-colors uppercase tracking-widest flex items-center gap-1.5">Profile</Link>
             <Link href="/api" className="text-sm font-bold text-white hover:text-yellow-400 transition-colors uppercase tracking-widest flex items-center gap-1.5">Play Frame</Link>
          </div>
          <p className="text-xs font-bold text-yellow-500/60 uppercase tracking-[0.3em]">Built on Celo</p>
        </footer>
        </div>
      </div>
    </main>
  )
}
