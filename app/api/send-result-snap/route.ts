import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const apiKey = process.env.NEYNAR_API_KEY || '';
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://find-celo.vercel.app';

const client = new NeynarAPIClient({
  apiKey: apiKey,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { winnerAddress, prize, winningLand, didWin, userFid } = body;

    if (!userFid) {
      return NextResponse.json({ error: 'Missing userFid' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Neynar API key not configured' }, { status: 500 });
    }

    const title = didWin ? "🏆 YOU WON!" : "💀 GAME OVER";
    const description = didWin
      ? `You won ${prize} CELO on FindCelo! Winning land: #${winningLand}`
      : `The treasure was in Land #${winningLand}. You didn't win this time.`;
    const imageUrl = didWin
      ? `${BASE_URL}/images/winner.png`
      : `${BASE_URL}/images/loser.png`;

    const snapPayload = {
      version: "1",
      title,
      description,
      imageUrl,
      button: {
        title: didWin ? "Play Again" : "Try Again",
        action: {
          type: "launch_frame",
          name: "FindCelo",
          url: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo`,
          splashImageUrl: `${BASE_URL}/images/logo.png`,
          splashBackgroundColor: "#3e2722"
        }
      }
    };

    const response = await fetch('https://api.neynar.com/v2/farcaster/subscribed_direct_message', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api_key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        recipient_fid: Number(userFid),
        message: JSON.stringify(snapPayload)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send DM');
    }

    return NextResponse.json({ success: true, response: data });
  } catch (error: any) {
    console.error('Error sending result snap:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
