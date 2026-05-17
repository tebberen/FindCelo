import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

const apiKey = process.env.NEYNAR_API_KEY || '';
const signerUuid = process.env.NEYNAR_SIGNER_UUID || '';

const client = new NeynarAPIClient({
  apiKey: apiKey,
});

const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerUsername, landNumber, currentPlayers, totalPlayers, txHash } = body;

    if (playerUsername === undefined || landNumber === undefined || currentPlayers === undefined || totalPlayers === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!apiKey || !signerUuid) {
      return NextResponse.json({ error: 'Neynar API key or Signer UUID not configured' }, { status: 500 });
    }

    // Optionally verify the txHash on-chain before casting to prevent fake cast requests
    if (txHash) {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
        if (!receipt || receipt.status !== 'success') {
          return NextResponse.json({ error: 'Invalid or failed transaction' }, { status: 400 });
        }
      } catch (error) {
        console.error('Error verifying txHash:', error);
        return NextResponse.json({ error: 'Transaction verification failed' }, { status: 400 });
      }
    }

    const remainingPlayers = totalPlayers - currentPlayers;
    const moreAdventurersText = remainingPlayers === 1 ? 'adventurer' : 'adventurers';

    const castText = `⚔️ Adventurer @${playerUsername.replace('@', '')} has set foot on Treasure Island! ⚔️\n🏝️ They claimed Land ${landNumber}.\nNow ${currentPlayers}/${totalPlayers} players are on the island. ${remainingPlayers} more ${moreAdventurersText} needed to find the treasure!\nJoin the hunt: 👇\nhttps://find-celo.vercel.app\n#FindCelo #Celo #TreasureIsland`;

    const response = await client.publishCast({
      signerUuid,
      text: castText,
      embeds: [
        {
          url: 'https://find-celo.vercel.app/api/snaps/join'
        }
      ] as any
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Neynar Player Joined Cast Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
