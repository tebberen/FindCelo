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
    const { landIndex, userAddress, seatsFilled, txHash } = body;

    if (landIndex === undefined || userAddress === undefined || seatsFilled === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!apiKey || !signerUuid) {
      return NextResponse.json({ error: 'Neynar API key or Signer UUID not configured' }, { status: 500 });
    }

    // Verify the txHash on-chain before casting to prevent fake cast requests
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

    const totalPlayers = 6;
    const remainingPlayers = totalPlayers - seatsFilled;
    const moreAdventurersText = remainingPlayers === 1 ? 'adventurer' : 'adventurers';

    // Get username from Neynar if possible, or use address
    let playerDisplay = userAddress.slice(0, 4) + '...' + userAddress.slice(-4);
    try {
        const users = await client.fetchBulkUsersByEthOrSolAddress({ addresses: [userAddress] }) as any;
        if (users[userAddress.toLowerCase()]) {
            playerDisplay = `@${users[userAddress.toLowerCase()].username}`;
        }
    } catch (e) {
        console.error('Error fetching username from Neynar:', e);
    }

    const referralUrl = `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?ref=${userAddress}`;
    const castText = `⚔️ Adventurer ${playerDisplay} has set foot on Treasure Island! ⚔️\n🏝️ They claimed Land ${landIndex}.\nNow ${seatsFilled}/${totalPlayers} players are on the island. ${remainingPlayers} more ${moreAdventurersText} needed to find the treasure!\nJoin the hunt: 👇\n${referralUrl}\n#FindCelo #Celo #TreasureIsland`;

    const response = await client.publishCast({
      signerUuid,
      text: castText,
      embeds: [referralUrl] as any // Use array of strings as per user instruction
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Neynar Post Join Cast Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
