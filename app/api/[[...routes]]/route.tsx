/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog'
import { handle } from 'frog/next'
import { parseEther, createPublicClient, http, formatEther } from 'viem'
import { celo } from 'viem/chains'
import { CONTRACT_ADDRESS, FIND_CELO_ABI, TABLE_TYPES, TABLE_COSTS } from '@/src/constants'

const app = new Frog({
  basePath: '/api',
  title: 'FindCelo - Treasure Island',
  hub: {
    apiUrl: "https://hubs.airstack.xyz",
    fetchOptions: {
      headers: {
        "x-airstack-hubs": process.env.AIRSTACK_API_KEY || "",
      }
    }
  }
})

const publicClient = createPublicClient({
    chain: celo,
    transport: http()
})

const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

// Helper to get referral from query or state
const getRef = (c: any) => {
  const url = new URL(c.url)
  return url.searchParams.get('ref') || '0x0000000000000000000000000000000000000000'
}

// Initial Frame
app.frame('/', async (c) => {
  const ref = getRef(c)

  let latestWinner = 'None yet'
  let latestPrize = '0'

  try {
    const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: FIND_CELO_ABI.find((x: any) => x.name === 'TableFilled') as any,
        fromBlock: 'latest',
        strict: true,
    })

    if (logs.length > 0) {
        const lastLog = logs[logs.length - 1] as any
        latestWinner = lastLog.args.winner
        latestPrize = formatEther(lastLog.args.prize)
    }
  } catch (e) {
    console.error('Error fetching logs:', e)
  }

  return c.res({
    image: (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#f59e0b', // Amber/Yellow
        color: '#1e3a8a', // Dark Blue for contrast
        fontSize: 60,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 40,
        backgroundImage: 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
      }}>
        <span style={{ fontSize: 80 }}>🏝️ Treasure Island</span>
        <span style={{ fontSize: 30, marginTop: 20 }}>Find the hidden treasure on Celo!</span>

        {latestWinner !== 'None yet' && (
            <div style={{
                marginTop: 40,
                padding: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 20,
                display: 'flex',
                flexDirection: 'column',
                fontSize: 25
            }}>
                <span style={{ color: '#c2410c' }}>👑 LATEST WINNER 👑</span>
                <span>{latestWinner.slice(0,6)}...{latestWinner.slice(-4)} won {latestPrize} CELO</span>
            </div>
        )}
      </div>
    ),
    intents: [
      <Button action={`/tables?ref=${ref}`}>Start Game</Button>,
      <Button.Link href={`${NEXT_PUBLIC_URL}/leaderboard`}>Leaderboard</Button.Link>,
    ]
  })
})

// Table Selection
app.frame('/tables', (c) => {
  const ref = getRef(c)
  return c.res({
    image: (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#f59e0b',
        color: '#1e3a8a',
        fontSize: 40,
        textAlign: 'center'
      }}>
        <span style={{ fontSize: 50, marginBottom: 20 }}>Choose your Table</span>
      </div>
    ),
    intents: [
      <Button action={`/lands/bronze?ref=${ref}`}>Bronze (1 CELO)</Button>,
      <Button action={`/lands/silver?ref=${ref}`}>Silver (5 CELO)</Button>,
      <Button action={`/lands/gold?ref=${ref}`}>Gold (10 CELO)</Button>,
    ]
  })
})

// Land Selection for each table
const landSelectionFrame = (tableType: string) => (c: any) => {
  const ref = getRef(c)
  return c.res({
    image: (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#f59e0b',
        color: '#1e3a8a',
        fontSize: 40,
        textAlign: 'center'
      }}>
        <span style={{ fontSize: 50, marginBottom: 20 }}>{tableType.toUpperCase()} Table</span>
        <span>Pick a Land (1-6)</span>
      </div>
    ),
    intents: [
      <Button action={`/join/${tableType}/1?ref=${ref}`}>1</Button>,
      <Button action={`/join/${tableType}/2?ref=${ref}`}>2</Button>,
      <Button action={`/join/${tableType}/3?ref=${ref}`}>3</Button>,
      <Button action={`/lands2/${tableType}?ref=${ref}`}>Next</Button>,
    ]
  })
}

app.frame('/lands/bronze', landSelectionFrame('bronze'))
app.frame('/lands/silver', landSelectionFrame('silver'))
app.frame('/lands/gold', landSelectionFrame('gold'))

// Second set of lands
const landSelectionFrame2 = (tableType: string) => (c: any) => {
    const ref = getRef(c)
    return c.res({
      image: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#f59e0b',
          color: '#1e3a8a',
          fontSize: 40,
          textAlign: 'center'
        }}>
          <span style={{ fontSize: 50, marginBottom: 20 }}>{tableType.toUpperCase()} Table</span>
          <span>Pick a Land (4-6)</span>
        </div>
      ),
      intents: [
        <Button action={`/join/${tableType}/4?ref=${ref}`}>4</Button>,
        <Button action={`/join/${tableType}/5?ref=${ref}`}>5</Button>,
        <Button action={`/join/${tableType}/6?ref=${ref}`}>6</Button>,
        <Button action={`/lands/${tableType}?ref=${ref}`}>Back</Button>,
      ]
    })
  }

app.frame('/lands2/bronze', landSelectionFrame2('bronze'))
app.frame('/lands2/silver', landSelectionFrame2('silver'))
app.frame('/lands2/gold', landSelectionFrame2('gold'))

app.frame('/join/:table/:land', (c) => {
    const { table, land } = c.req.param()
    const ref = getRef(c)
    return c.res({
        image: (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: '#ea580c', // Orange
              color: 'white',
              fontSize: 40,
              textAlign: 'center',
              padding: 40
            }}>
              <span>Confirm joining Land {land} on {table.toUpperCase()} Table</span>
              <span style={{ fontSize: 20, marginTop: 20, opacity: 0.8 }}>Prepare your CELO for the adventure!</span>
            </div>
          ),
          intents: [
            <Button.Transaction target={`/tx/${table}/${land}?ref=${ref}`} action="/finish">Join Game</Button.Transaction>,
            <Button action={`/lands/${table}?ref=${ref}`}>Cancel</Button>
          ]
    })
})

// Transaction Handler
app.transaction('/tx/:table/:land', (c) => {
  const { table, land } = c.req.param()
  const tableIndex = (TABLE_TYPES as any)[table.toUpperCase()]
  const cost = (TABLE_COSTS as any)[tableIndex]
  const ref = getRef(c)

  return c.res({
    chainId: 'eip155:42220' as any, // Celo Mainnet
    method: 'contract',
    abi: FIND_CELO_ABI as any,
    functionName: 'joinGame',
    to: CONTRACT_ADDRESS as `0x${string}`,
    args: [BigInt(land), ref as `0x${string}`, tableIndex],
    value: parseEther(cost),
  } as any)
})

app.frame('/finish', (c) => {
    return c.res({
        image: (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: '#f59e0b',
              color: '#1e3a8a',
              fontSize: 40,
              textAlign: 'center',
              padding: 40
            }}>
              <span style={{ fontSize: 60, marginBottom: 20 }}>💰</span>
              <span>Transaction Sent! Check back soon to see if you found the treasure.</span>
            </div>
          ),
          intents: [
            <Button action="/">Back to Start</Button>,
            <Button.Link href={`${NEXT_PUBLIC_URL}/profile`}>View My Stats</Button.Link>
          ]
    })
})

export const GET = handle(app)
export const POST = handle(app)
