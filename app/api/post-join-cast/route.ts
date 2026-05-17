import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const apiKey = process.env.NEYNAR_API_KEY || '';
const signerUuid = process.env.NEYNAR_SIGNER_UUID || '';

const client = new NeynarAPIClient({
  apiKey: apiKey,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { landIndex, seatsFilled, userAddress, username } = body;

    if (landIndex === undefined || seatsFilled === undefined || !userAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!signerUuid) {
      return NextResponse.json({ error: 'Signer UUID not configured' }, { status: 500 });
    }

    const displayUsername = username ? `@${username}` : `${userAddress.slice(0, 4)}...${userAddress.slice(-4)}`;
    const referralUrl = `https://find-celo.vercel.app/?ref=${userAddress}`;
    const emptyCount = 6 - seatsFilled;

    const text = `⚔️ Adventurer ${displayUsername} has set foot on Treasure Island! ⚔️\n\n🏝️ They claimed Land ${landIndex}.\n\nNow ${seatsFilled}/6 players are on the island. ${emptyCount} more adventurers needed to find the treasure!\n\nJoin the hunt: 👇\n${referralUrl}\n\n#FindCelo #Celo #TreasureIsland`;

    const response = await client.publishCast({
      signerUuid,
      text,
      embeds: [{ url: referralUrl }]
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Neynar Post Join Cast Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
