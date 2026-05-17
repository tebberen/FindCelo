import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, decodeEventLog, formatEther } from 'viem';
import { celo } from 'viem/chains';
import { FIND_CELO_ABI } from '@/src/constants';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://find-celo.vercel.app';
const CELO_YELLOW = "#FCFF52";
const OG_IMAGE_URL = `${BASE_URL}/images/logo.png`;

const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type, Authorization, X-Requested-With',
  'Access-Control-Expose-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const accept = req.headers.get('accept') ?? '';
  if (!accept.includes('application/vnd.farcaster.snap+json')) {
    return NextResponse.redirect(BASE_URL);
  }

  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get('gameId');

  if (!gameId) {
    return new NextResponse(JSON.stringify({ error: 'Missing gameId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash: gameId as `0x${string}` });

    if (!receipt || receipt.status !== 'success') {
       throw new Error('Transaction failed or not found');
    }

    const tableFilledLog = receipt.logs.find(log => {
      try {
        const decoded = decodeEventLog({
          abi: FIND_CELO_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'TableFilled';
      } catch {
        return false;
      }
    });

    if (!tableFilledLog) {
       throw new Error('No TableFilled event found');
    }

    const decoded = decodeEventLog({
      abi: FIND_CELO_ABI,
      data: tableFilledLog.data,
      topics: tableFilledLog.topics,
    }) as any;

    const winner = decoded.args.winner;
    const prize = formatEther(decoded.args.prize);
    const winningLand = Number(decoded.args.winningLand);

    let winnerDisplay = `${winner.slice(0, 6)}...${winner.slice(-4)}`;

    // Try to get Neynar username
    try {
      const neynarApiKey = process.env.NEYNAR_API_KEY;
      if (neynarApiKey) {
        const client = new NeynarAPIClient({ apiKey: neynarApiKey });
        const response: any = await client.fetchBulkUsersByEthOrSolAddress({ addresses: [winner] });
        const userData = response[winner.toLowerCase()]?.[0];
        if (userData?.username) {
          winnerDisplay = `@${userData.username}`;
        }
      }
    } catch (e) {
      console.error('Neynar lookup failed:', e);
    }

    const snapPayload = {
      version: "2.0",
      theme: { accent: CELO_YELLOW },
      ui: {
        root: "main",
        elements: {
          main: {
            type: "stack",
            props: { direction: "vertical", gap: "md" },
            children: ["banner", "title", "results", "progress_stack", "play_btn"]
          },
          banner: { type: "image", props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" } },
          title: {
            type: "text",
            props: { content: "🏆 FindCelo Result", weight: "bold", size: "lg", align: "center" }
          },
          results: {
            type: "item_group",
            props: { border: true, separator: true },
            children: ["winner_row", "prize_row", "land_row"]
          },
          winner_row: { type: "item", props: { title: "Winner", description: winnerDisplay } },
          prize_row: { type: "item", props: { title: "Prize", description: `${prize} CELO` } },
          land_row: { type: "item", props: { title: "Winning Land", description: `#${winningLand}` } },
          progress_stack: {
            type: "stack",
            props: { gap: "xs" },
            children: ["progress_label", "progress_bar"]
          },
          progress_label: { type: "text", props: { content: "Table Status", size: "sm" } },
          progress_bar: {
            type: "progress_bar",
            props: { value: 1, max: 1 } // Always 100% since game starts when full
          },
          play_btn: {
            type: "button",
            props: { label: "Play Next Round", variant: "primary" },
            on: { press: { action: "open_mini_app", params: { target: BASE_URL } } }
          }
        }
      }
    };

    return new NextResponse(JSON.stringify(snapPayload), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.farcaster.snap+json',
        'Vary': 'Accept',
      },
    });

  } catch (error) {
    console.error('Result snap error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch game result' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
