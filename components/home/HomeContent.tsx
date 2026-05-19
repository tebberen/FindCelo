'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient, useConnect, useWatchContractEvent } from 'wagmi'
import { parseEther, formatEther, decodeEventLog, isAddress } from 'viem'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { sdk } from '@farcaster/miniapp-sdk'
import type { Context } from '@farcaster/miniapp-core'
import { CONTRACT_ADDRESS, FIND_CELO_ABI, TABLE_TYPES, TABLE_COSTS } from '@/src/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { HelpCircle, Volume2, VolumeX } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NeynarAuthButton } from '@/components/auth/NeynarAuthButton'

export default function HomeContent() {
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const searchParams = useSearchParams()
  const [selectedTable, setSelectedTable] = useState('BRONZE')
  const [isMiniPay, setIsMiniPay] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<Context.UserContext | null>(null)
  const [lastJoinedLand, setLastJoinedLand] = useState<number | null>(null)
  const [preSelectedLand, setPreSelectedLand] = useState<number | null>(null)

  // Handle Snap query parameters
  useEffect(() => {
    const tier = searchParams.get('tier')
    if (tier === '0') setSelectedTable('BRONZE')
    else if (tier === '1') setSelectedTable('SILVER')
    else if (tier === '2') setSelectedTable('GOLD')

    const land = searchParams.get('land')
    if (land) {
      const landNum = parseInt(land)
      if (landNum >= 1 && landNum <= 6) {
        setPreSelectedLand(landNum)
      }
    }
  }, [searchParams])

  // Load lastJoinedLand from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('last_joined_land')
    if (saved) setLastJoinedLand(parseInt(saved))
  }, [])
  const [lastWinAmount, setLastWinAmount] = useState<string | null>(null)
  const [lastProcessedWinnerRound, setLastProcessedWinnerRound] = useState<string | null>(null)
  const [lastCastedHash, setLastCastedHash] = useState<string | null>(null)
  const [winningLand, setWinningLand] = useState<number | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false)
  const [gameResult, setGameResult] = useState<'WINNER' | 'LOSER' | null>(null)
  const [modalData, setModalData] = useState<{winner: string, land: number, prize: string} | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  const [localResult, setLocalResult] = useState<{
    didWin: boolean;
    prizeWon: string;
    winningLand: number;
    gameId: string;
    tableIndex: number;
  } | null>(null)

  const isMutedRef = React.useRef(isMuted)
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  const playSound = useCallback((type: 'click' | 'win') => {
    if (isMutedRef.current) return
    const sounds = {
      click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'
    }
    const audio = new Audio(sounds[type])
    audio.play().catch(e => console.log('Audio play failed:', e))
  }, [])

  // Capture referral
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref && isAddress(ref)) {
      localStorage.setItem('referral_address', ref)
    }
  }, [searchParams])

  // Detect MiniPay and Farcaster
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum?.isMiniPay) {
      setIsMiniPay(true)
    }

    const loadFarcaster = async () => {
      const context = await sdk.context
      if (context?.user) {
        setFarcasterUser(context.user)
      } else if (address) {
        try {
          const res = await fetch(`/api/neynar?action=fetch-user-by-address&address=${address}`)
          const data = await res.json()
          if (data && data.fid) {
            setFarcasterUser({
              fid: data.fid,
              username: data.username,
              displayName: data.display_name,
              pfpUrl: data.pfp_url
            } as any)
          }
        } catch (err) {
          console.error('Failed to fetch user from Neynar:', err)
        }
      }
    }
    loadFarcaster()
  }, [address])

  // Onboarding check
  useEffect(() => {
    const onboardingDone = localStorage.getItem('onboarding_done')
    const howToPlaySeen = localStorage.getItem('how_to_play_seen')

    if (!onboardingDone) {
      setShowOnboarding(true)
    }
    if (!howToPlaySeen) {
      setShowHowToPlayModal(true)
    }
  }, [])

  // Register user FID mapping
  useEffect(() => {
    if (isConnected && address && farcasterUser?.fid) {
      fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, fid: farcasterUser.fid })
      }).catch(err => console.error('Failed to register user:', err))
    }
  }, [isConnected, address, farcasterUser])

  useEffect(() => {
    window.onNeynarAuthSuccess = (data: any) => {
      if (data.user) {
        setFarcasterUser({
          fid: data.user.fid,
          username: data.user.username,
          displayName: data.user.display_name,
          pfpUrl: data.user.pfp_url
        } as any);

        if (isConnected && address) {
          fetch('/api/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, fid: data.user.fid })
          }).catch(err => console.error('Failed to register user from Neynar SIWN:', err))
        }
      }
    };
  }, [isConnected, address]);

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
  const [winnerProfiles, setWinnerProfiles] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetchWinnerProfiles = async () => {
      const addresses = Array.from(new Set(recentWinners.map(w => w.address))).filter(Boolean);
      if (addresses.length > 0) {
        try {
          const res = await fetch(`/api/neynar?action=fetch-bulk-users&addresses=${addresses.join(',')}`)
          const data = await res.json()
          setWinnerProfiles(prev => ({ ...prev, ...data }))
        } catch (err) {
          console.error('Failed to fetch winner profiles:', err)
        }
      }
    }
    fetchWinnerProfiles()
  }, [recentWinners])

  // Load winners from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recent_winners')
    if (saved) {
      try {
        setRecentWinners(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved winners', e)
      }
    }
  }, [])

  // Save winners to localStorage when state changes
  useEffect(() => {
    if (recentWinners.length > 0) {
      localStorage.setItem('recent_winners', JSON.stringify(recentWinners))
    }
  }, [recentWinners])

  const publicClient = usePublicClient()

  const tableIndex = (TABLE_TYPES as any)[selectedTable]

  // Feature 1: Check for pending game result on load
  useEffect(() => {
    const checkPendingGame = async () => {
      if (!address || !publicClient) return;
      const pendingRaw = localStorage.getItem('pending_game');
      if (!pendingRaw) return;

      try {
        const pending = JSON.parse(pendingRaw);
        if (pending.address.toLowerCase() !== address.toLowerCase()) return;

        // Fetch TableFilled events for this table since the user joined
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS as `0x${string}`,
          event: FIND_CELO_ABI.find((x: any) => x.name === 'TableFilled') as any,
          fromBlock,
          toBlock: 'latest',
        });

        // Find if any TableFilled event happened after joining that matches the user's participation
        // For simplicity, we check the last 20 events
        const tableFilledLogs = logs.reverse().slice(0, 20);

        for (const log of tableFilledLogs) {
          const txHash = log.transactionHash;
          const gameResults = JSON.parse(localStorage.getItem('gameResults') || '{}');

          // If we already have this result saved for this address, skip
          if (gameResults[address.toLowerCase()]?.gameId === txHash) continue;

          // We need to know who the 6 players were. We check GameJoined events in that transaction block or before
          const joinLogs = await publicClient.getLogs({
            address: CONTRACT_ADDRESS as `0x${string}`,
            event: FIND_CELO_ABI.find((x: any) => x.name === 'GameJoined') as any,
            fromBlock: log.blockNumber && log.blockNumber > 500n ? log.blockNumber - 500n : 0n,
            toBlock: log.blockNumber,
          });

          const tableType = (log as any).args.tableType;
          const players = joinLogs
            .filter((j: any) => j.args.tableType === tableType)
            .slice(-6)
            .map((j: any) => j.args.player.toLowerCase());

          if (players.includes(address.toLowerCase())) {
            // This is a result for a game the user was in!
            const winner = (log as any).args.winner.toLowerCase();
            const winningLand = Number((log as any).args.winningLand);
            const prize = formatEther((log as any).args.prize);
            const didWin = winner === address.toLowerCase();

            const result = {
              gameId: txHash,
              didWin,
              prizeWon: prize,
              winningLand,
              tableIndex: tableType,
              seen: false,
              timestamp: Date.now()
            };

            // Save to gameResults
            gameResults[address.toLowerCase()] = result;
            localStorage.setItem('gameResults', JSON.stringify(gameResults));

            // Save to history (Feature 3)
            const historyKey = `gameHistory_${address.toLowerCase()}`;
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            if (!history.find((h: any) => h.gameId === txHash)) {
              history.unshift(result);
              localStorage.setItem(historyKey, JSON.stringify(history));
            }

            setLocalResult(result);
            setIsResultModalOpen(true);
            localStorage.removeItem('pending_game');
            break;
          }
        }
      } catch (e) {
        console.error('Error checking pending game:', e);
      }
    };

    if (isConnected && address) {
      checkPendingGame();
    }
  }, [isConnected, address, publicClient]);
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
          const referralUrl = `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?ref=${address}`

          if (tableFilledLog) {
            const decoded = decodeEventLog({
              abi: FIND_CELO_ABI,
              data: tableFilledLog.data,
              topics: tableFilledLog.topics,
            }) as any

            const winner = decoded.args.winner
            const prize = formatEther(decoded.args.prize)
            const winnerLand = Number(decoded.args.winningLand)

            fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ txHash: receipt.transactionHash })
            }).catch(err => console.error('Failed to trigger notifications:', err))

            const winnerUsername = winner.toLowerCase() === address?.toLowerCase()
              ? (farcasterUser?.username ? `@${farcasterUser.username}` : winner.slice(0, 4) + '...' + winner.slice(-4))
              : winner.slice(0, 4) + '...' + winner.slice(-4)

            setWinningLand(winnerLand)
            setGameResult(winner.toLowerCase() === address?.toLowerCase() ? 'WINNER' : 'LOSER')
            setModalData({ winner, land: winnerLand, prize })
            setIsWinnerModalOpen(true)

            // Feature 1: Save result to localStorage
            if (address) {
              const gameResults = JSON.parse(localStorage.getItem('gameResults') || '{}');
              const result = {
                gameId: receipt.transactionHash,
                didWin: winner.toLowerCase() === address.toLowerCase(),
                prizeWon: prize,
                winningLand: winnerLand,
                tableIndex: decoded.args.tableType,
                seen: true, // Already seeing it via the live winner modal
                timestamp: Date.now()
              };
              gameResults[address.toLowerCase()] = result;
              localStorage.setItem('gameResults', JSON.stringify(gameResults));

              // Feature 3: Add to history
              const historyKey = `gameHistory_${address.toLowerCase()}`;
              const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
              if (!history.find((h: any) => h.gameId === receipt.transactionHash)) {
                history.unshift(result);
                localStorage.setItem(historyKey, JSON.stringify(history));
              }
              localStorage.removeItem('pending_game');
            }

            playSound('win')
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#FFD700', '#FFA500', '#FFFFFF']
            })

            text = `🎉 TREASURE FOUND! 🎉\n\n${winnerUsername} won ${prize} CELO! 🤑\nThe treasure was hidden in Land ${winnerLand}.\n\nCongratulations! 🎊 A new round has started. Try your luck:\n👇 ${referralUrl}\n\n#FindCelo #Celo #TreasureIsland`

            try {
              await fetch('/api/neynar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'post-cast', text, embeds: [referralUrl] })
              })
            } catch (e) {
              await sdk.actions.composeCast({
                text,
                embeds: [referralUrl]
              })
            }
          } else {
            const castText = `Adventurer ${username} has set foot on Treasure Island! ✨\n\nThey claimed Land ${lastJoinedLand}.\n\nNow ${currentFilled}/6 players are on the island. ${6 - currentFilled} more adventurers needed to find the treasure!\n\nJoin the hunt: 🔥\nhttps://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?ref=${address}\n\n#FindCelo #Celo #TreasureIsland`;

            try {
              await sdk.actions.composeCast({
                text: castText,
              });
            } catch (error) {
              const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`;
              window.open(warpcastUrl, '_blank');
            }
            localStorage.removeItem('last_joined_land');
            setLastJoinedLand(null);
          }
        } catch (error) {
          console.error('Error triggering auto-cast:', error)
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
        setLastProcessedWinnerRound(latestWinner.roundId)

        playSound('win')
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF']
        })
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

        const formattedWinners = await Promise.all(logs.reverse().slice(0, 10).map(async (log: any) => {
          const block = await publicClient.getBlock({ blockHash: log.blockHash })
          return {
            address: log.args.winner,
            amount: formatEther(log.args.prize),
            tableType: log.args.tableType === 0 ? 'BRONZE' : log.args.tableType === 1 ? 'SILVER' : 'GOLD',
            land: Number(log.args.winningLand),
            roundId: log.blockNumber.toString().slice(-5),
            hash: log.transactionHash,
            timestamp: Number(block.timestamp) * 1000
          }
        }))

        setRecentWinners(prev => {
            const combined = [...formattedWinners, ...prev]
            const unique = combined.filter((v, i, a) => a.findIndex(t => t.hash === v.hash) === i)
            return unique.slice(0, 10)
        })
      } catch (e) {
        console.error('Error fetching winners:', e)
      }
    }
    fetchWinners()
  }, [publicClient, isConfirmed])

  // Real-time listener for TableFilled events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FIND_CELO_ABI,
    eventName: 'TableFilled',
    onLogs(logs) {
      const now = Date.now();
      if (logs.length > 0) {
        const latestLog = logs[logs.length - 1] as any;
        const winner = latestLog.args.winner;
        const winnerLand = Number(latestLog.args.winningLand);
        const prize = formatEther(latestLog.args.prize);

        setWinningLand(winnerLand);
        setGameResult(winner.toLowerCase() === address?.toLowerCase() ? 'WINNER' : 'LOSER');
        setModalData({ winner, land: winnerLand, prize });
        setIsWinnerModalOpen(true);

        // Save to localStorage for persistence
        if (address) {
          const gameResults = JSON.parse(localStorage.getItem('gameResults') || '{}');
          const result = {
            gameId: latestLog.transactionHash,
            didWin: winner.toLowerCase() === address.toLowerCase(),
            prizeWon: prize,
            winningLand: winnerLand,
            tableIndex: latestLog.args.tableType,
            seen: true,
            timestamp: Date.now()
          };
          gameResults[address.toLowerCase()] = result;
          localStorage.setItem('gameResults', JSON.stringify(gameResults));

          const historyKey = `gameHistory_${address.toLowerCase()}`;
          const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
          if (!history.find((h: any) => h.gameId === latestLog.transactionHash)) {
            history.unshift(result);
            localStorage.setItem(historyKey, JSON.stringify(history));
          }
          localStorage.removeItem('pending_game');
        }
      }

      const newWinners = logs.map((log: any) => ({
        address: log.args.winner,
        amount: formatEther(log.args.prize),
        tableType: log.args.tableType === 0 ? 'BRONZE' : log.args.tableType === 1 ? 'SILVER' : 'GOLD',
        land: Number(log.args.winningLand),
        roundId: log.blockNumber.toString().slice(-5),
        hash: log.transactionHash,
        timestamp: now
      }))

      setRecentWinners(prev => {
        const combined = [...newWinners, ...prev]
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.hash === v.hash) === i)
        return unique.slice(0, 10)
      })
    },
  })

  const handleJoinGame = (land: number) => {
    playSound('click')
    if (!isConnected || !address) return
    setWinningLand(null)
    setLastJoinedLand(land)
    localStorage.setItem('last_joined_land', land.toString())

    // Feature 1: Save pending game to check if user leaves and returns
    localStorage.setItem('pending_game', JSON.stringify({
      address: address.toLowerCase(),
      tableIndex,
      landIndex: land,
      timestamp: Date.now()
    }))

    const referrer = localStorage.getItem('referral_address') || '0x0000000000000000000000000000000000000000'

    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FIND_CELO_ABI,
      functionName: 'joinGame',
      args: [BigInt(land), referrer as `0x${string}`, tableIndex],
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

            <Button onClick={() => playSound('click')} asChild variant="ghost" size="sm" className="h-6 gap-0.5 px-1 text-white hover:bg-white/10 border border-white/5 bg-white/5 shrink-0">
              <Link href="/leaderboard">
                <span>🏆</span>
                <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider">Leader</span>
              </Link>
            </Button>

            <Button onClick={() => playSound('click')} asChild variant="ghost" size="sm" className="h-6 gap-0.5 px-1 text-white hover:bg-white/10 border border-white/5 bg-white/5 shrink-0">
              <Link href="/profile">
                <span>👤</span>
                <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider">Profile</span>
              </Link>
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => playSound('click')} variant="ghost" size="sm" className="h-6 gap-0.5 px-1 text-white hover:bg-white/10 border border-white/5 bg-white/5 shrink-0">
                  <HelpCircle className="w-3 h-3" />
                  <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider">How to Play</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-amber-500/50 text-white max-w-[90vw] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-pirata text-2xl text-yellow-500 tracking-widest text-center">
                    🏝️ How to Play
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                    <p className="text-sm">Choose a table: <span className="font-bold text-yellow-400">1 CELO, 5 CELO, or 10 CELO</span></p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                    <p className="text-sm">Pick a land (1-6) and <span className="font-bold text-yellow-400">stake your CELO</span></p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                    <p className="text-sm">Wait for all <span className="font-bold text-yellow-400">6 lands to fill</span></p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">4</div>
                    <p className="text-sm">Winner takes <span className="font-bold text-yellow-400">5/6 of the pot</span> (5x their stake!)</p>
                  </div>
                  <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                    <p className="text-xs text-white/60 italic">Example: Stake 1 CELO → Win 5 CELO</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => {
                const newMuted = !isMuted
                setIsMuted(newMuted)
                if (isMuted) {
                   const a = new Audio()
                   a.play().catch(() => {})
                }
              }}
              variant="ghost"
              size="sm"
              className="h-6 gap-0.5 px-1 text-white hover:bg-white/10 border border-white/5 bg-white/5 shrink-0"
            >
              {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider">{isMuted ? 'Muted' : 'Sound On'}</span>
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
              <div className="flex items-center gap-2">
                <NeynarAuthButton />
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
              </div>
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
                onClick={() => {
                  playSound('click')
                  setSelectedTable(table)
                }}
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
             {gameResult ? (
                gameResult === 'WINNER' ? (
                  <p className="text-sm font-bold text-white animate-pulse">
                    🎉 Congratulations! You won <span className="text-yellow-400 font-black">{modalData?.prize} CELO</span>!
                  </p>
                ) : (
                  <p className="text-sm font-bold text-white">
                    💀 Treasure was on Land <span className="text-yellow-400 font-black">#{modalData?.land}</span>. Better luck next time!
                  </p>
                )
             ) : userLand > 0 ? (
                <p className="text-sm font-bold text-white">
                   You are on Land <span className="text-yellow-400 font-black">#{userLand}</span>. Waiting for <span className="text-yellow-400 font-black">{6 - seatsFilled}</span> more players.
                </p>
             ) : (
                <p className="text-sm font-bold text-white/80 flex gap-1.5 items-center">
                  Select a land to join the voyage
                </p>
             )}
          </div>
        </div>

        {/* LAND GRID */}
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6].map((land) => {
            const playerAddress = tablePlayers ? (tablePlayers as any)[land] : '0x0000000000000000000000000000000000000000'
            const isOccupied = playerAddress !== '0x0000000000000000000000000000000000000000'
            const isUser = address && playerAddress.toLowerCase() === address.toLowerCase()
            const isWinner = winningLand === land

            return (
              <motion.div
                key={land}
                initial={false}
                whileHover={{ scale: isOccupied ? 1 : 1.05 }}
                whileTap={{ scale: isOccupied ? 1 : 0.95 }}
                animate={isWinner ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 0 0px rgba(255, 215, 0, 0)",
                    "0 0 20px rgba(255, 215, 0, 0.6)",
                    "0 0 0px rgba(255, 215, 0, 0)"
                  ]
                } : {}}
                transition={isWinner ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
                <Card
                  className={`
                    relative flex flex-col items-center justify-start overflow-hidden
                    transition-all duration-200 cursor-pointer group border-2 h-full
                    ${isWinner
                      ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_15px_rgba(255,215,0,0.4)] z-10'
                      : !isOccupied
                        ? (preSelectedLand === land ? 'border-primary bg-primary/20 shadow-[0_0_10px_rgba(252,255,82,0.3)]' : 'hover:border-primary/50 bg-black/30 backdrop-blur-sm border-amber-500/30')
                        : isUser
                          ? 'border-primary ring-1 ring-primary/20 bg-black/60 backdrop-blur-sm'
                          : 'opacity-60 bg-black/40 backdrop-blur-sm border-white/10'}
                  `}
                  onClick={() => {
                    if (!isOccupied) {
                      setPreSelectedLand(null)
                      handleJoinGame(land)
                    }
                  }}
                >
                  <div className="w-full aspect-square relative overflow-hidden bg-black/20">
                    <img
                      src="/images/treasure-chest.png"
                      alt="Land"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-2 w-full flex flex-col items-center">
                    <span className="text-[14px] font-bold uppercase text-yellow-200 block w-full truncate text-center">
                       {land}
                    </span>
                    <span className="text-[11px] font-bold uppercase text-yellow-200/80 block w-full truncate text-center">
                       {isOccupied ? (isUser ? (farcasterUser ? `@${farcasterUser.username}` : 'YOU') : `${playerAddress.slice(0, 4)}...${playerAddress.slice(-4)}`) : 'EMPTY'}
                    </span>
                  </div>

                {isConfirming && !isOccupied && (
                   <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                   </div>
                )}
                {isWinner && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                    WINNER
                  </div>
                )}
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* RECENT WINNERS */}
        <div className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 px-1">
                👑 Recent Winners
            </h2>
            <div className="bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl divide-y divide-white/5 max-h-[250px] overflow-y-auto custom-scrollbar">
                {recentWinners.length > 0 ? (
                    recentWinners.map((winner, i) => (
                        <div key={winner.hash || i} className="px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-2 min-w-0">
                                {winnerProfiles[winner.address.toLowerCase()]?.pfp_url ? (
                                  <img src={winnerProfiles[winner.address.toLowerCase()].pfp_url} alt="" className="w-5 h-5 rounded-full border border-primary/30 shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[8px] shrink-0">👤</div>
                                )}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-nowrap">
                                        <span className="text-[10px] font-bold text-white truncate">
                                            {winnerProfiles[winner.address.toLowerCase()]?.username ? `@${winnerProfiles[winner.address.toLowerCase()].username}` : `${winner.address.slice(0, 4)}...${winner.address.slice(-4)}`}
                                        </span>
                                        {winner.timestamp && (
                                          <span className="text-[9px] text-white/40 font-bold uppercase whitespace-nowrap">
                                            • {(() => {
                                              const diff = Math.floor((Date.now() - winner.timestamp) / 1000);
                                              if (diff < 60) return `${diff}s ago`;
                                              if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                                              if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                                              return `${Math.floor(diff / 86400)}d ago`;
                                            })()}
                                          </span>
                                        )}
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
      {/* ONBOARDING MODAL */}
      <Dialog open={showOnboarding} onOpenChange={(open) => {
        setShowOnboarding(open)
        if (!open) localStorage.setItem('onboarding_done', 'true')
      }}>
        <DialogContent className="bg-slate-900 border-amber-500/50 text-white max-w-[90vw] rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-pirata text-2xl text-yellow-500 tracking-widest text-center">
              🔔 Welcome Explorer!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6 text-center">
            <p className="text-sm leading-relaxed">
              Add to <span className="font-bold text-yellow-400">Favorites</span> & <span className="font-bold text-yellow-400">Enable Notifications</span> to get game results and claim your treasure!
            </p>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                className="h-12 font-bold uppercase tracking-widest border-white/20 hover:bg-white/10"
                onClick={() => {
                  setShowOnboarding(false)
                  localStorage.setItem('onboarding_done', 'true')
                }}
              >
                Maybe Later
              </Button>
              <Button
                className="h-12 font-bold uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/20"
                onClick={async () => {
                  try {
                    await sdk.actions.addMiniApp()
                  } catch (e) {
                    console.error('Failed to add mini app:', e)
                  }
                  setShowOnboarding(false)
                  localStorage.setItem('onboarding_done', 'true')
                }}
              >
                Add to Favorites
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* HOW TO PLAY MODAL (FIRST OPEN) */}
      <Dialog open={showHowToPlayModal} onOpenChange={(open) => {
        setShowHowToPlayModal(open)
        if (!open) localStorage.setItem('how_to_play_seen', 'true')
      }}>
        <DialogContent className="bg-slate-900 border-amber-500/50 text-white max-w-[90vw] rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-pirata text-2xl text-yellow-500 tracking-widest text-center">
              🏝️ How to Play
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                    <p className="text-sm">Choose a table: <span className="font-bold text-yellow-400">1 CELO, 5 CELO, or 10 CELO</span></p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                    <p className="text-sm">Pick a land (1-6) and <span className="font-bold text-yellow-400">stake your CELO</span></p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                    <p className="text-sm">Wait for all <span className="font-bold text-yellow-400">6 lands to fill</span></p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">4</div>
                    <p className="text-sm">Winner takes <span className="font-bold text-yellow-400">5/6 of the pot</span> (5x their stake!)</p>
                  </div>
                  <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                    <p className="text-xs text-white/60 italic">Example: Stake 1 CELO → Win 5 CELO</p>
                  </div>
                  <Button
                    className="w-full h-12 mt-4 font-bold uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/20"
                    onClick={() => {
                      setShowHowToPlayModal(false)
                      localStorage.setItem('how_to_play_seen', 'true')
                    }}
                  >
                    Got it!
                  </Button>
                </div>
        </DialogContent>
      </Dialog>

      {/* RESULT MODAL (FOR RETURNING USERS) */}
      <Dialog open={isResultModalOpen} onOpenChange={(open) => {
        setIsResultModalOpen(open);
        if (!open && address) {
          const gameResults = JSON.parse(localStorage.getItem('gameResults') || '{}');
          if (gameResults[address.toLowerCase()]) {
            gameResults[address.toLowerCase()].seen = true;
            localStorage.setItem('gameResults', JSON.stringify(gameResults));
          }
        }
      }}>
        <DialogContent className="bg-slate-900 border-amber-500/50 text-white max-w-[90vw] rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
          <DialogHeader>
            <DialogTitle className={`font-pirata text-3xl tracking-widest text-center ${localResult?.didWin ? 'text-yellow-500 animate-bounce' : 'text-red-500'}`}>
              {localResult?.didWin ? '🎉 YOU WON! 🎉' : '💀 GAME OVER 💀'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            {localResult?.didWin ? (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-2">💰</div>
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-widest text-white/60">Prize Won</p>
                  <p className="text-4xl font-black text-yellow-500">{localResult?.prizeWon} CELO</p>
                </div>
                <div className="inline-block px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                  <p className="text-xs font-bold uppercase tracking-widest">Winning Land: <span className="text-yellow-400">#{localResult?.winningLand}</span></p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-2">🏝️</div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-white/60">The treasure was in</p>
                    <p className="text-xl font-bold text-white">Land #{localResult?.winningLand}</p>
                  </div>
                </div>
                <p className="text-lg font-pirata tracking-widest text-white/80 mt-4">Better luck next time!</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                className="h-12 font-bold uppercase tracking-widest border-white/20 hover:bg-white/10"
                onClick={() => setIsResultModalOpen(false)}
              >
                Close
              </Button>
              <Button
                className="h-12 font-bold uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/20"
                onClick={() => {
                  setIsResultModalOpen(false);
                  refetchPlayers();
                  refetchTableInfo();
                }}
              >
                New Game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* WINNER MODAL */}
      <Dialog open={isWinnerModalOpen} onOpenChange={setIsWinnerModalOpen}>
        <DialogContent className="bg-slate-900 border-amber-500/50 text-white max-w-[90vw] rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
          <DialogHeader>
            <DialogTitle className={`font-pirata text-3xl tracking-widest text-center ${gameResult === 'WINNER' ? 'text-yellow-500 animate-bounce' : 'text-red-500'}`}>
              {gameResult === 'WINNER' ? '🎉 YOU WON! 🎉' : '💀 TREASURE FOUND! 💀'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            {gameResult === 'WINNER' ? (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-2">💰</div>
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-widest text-white/60">Prize Won</p>
                  <p className="text-4xl font-black text-yellow-500">{modalData?.prize} CELO</p>
                </div>
                <div className="inline-block px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                  <p className="text-xs font-bold uppercase tracking-widest">Winning Land: <span className="text-yellow-400">#{modalData?.land}</span></p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-2">🏝️</div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-white/60">Winner</p>
                    <p className="text-xl font-mono font-bold text-yellow-500 truncate px-4">
                      {modalData?.winner.slice(0, 6)}...{modalData?.winner.slice(-4)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-white/60">Winning Land</p>
                    <p className="text-xl font-bold text-white">Land #{modalData?.land}</p>
                  </div>
                </div>
                <p className="text-lg font-pirata tracking-widest text-white/80 mt-4">Better luck next time!</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                className="h-12 font-bold uppercase tracking-widest border-white/20 hover:bg-white/10"
                onClick={() => setIsWinnerModalOpen(false)}
              >
                Close
              </Button>
              <Button
                className="h-12 font-bold uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/20"
                onClick={() => {
                  setIsWinnerModalOpen(false)
                  setWinningLand(null)
                  refetchPlayers()
                  refetchTableInfo()
                }}
              >
                New Game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
