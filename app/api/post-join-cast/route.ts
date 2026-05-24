import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { createPublicClient, http, formatEther } from 'viem';
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
    console.log('Post-join-cast request body:', body);
    const { landIndex, userAddress, seatsFilled, playerUsername, txHash } = body;

    if (landIndex === undefined || userAddress === undefined || seatsFilled === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!apiKey) {
      console.error('NEYNAR_API_KEY is not set');
      return NextResponse.json({ error: 'NEYNAR_API_KEY not configured' }, { status: 500 });
    }
    if (!signerUuid) {
      console.error('NEYNAR_SIGNER_UUID is not set');
      return NextResponse.json({ error: 'NEYNAR_SIGNER_UUID not configured' }, { status: 500 });
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

    const remaining = 6 - seatsFilled;

    let cost = 1;
    if (txHash) {
      try {
        const transaction = await publicClient.getTransaction({ hash: txHash as `0x${string}` });
        cost = Number(formatEther(transaction.value));
      } catch (error) {
        console.error('Error fetching transaction value:', error);
      }
    }
    const potentialPrize = cost * 5;

    // Get username from Neynar if possible, or use address
    let playerDisplay = playerUsername;
    if (!playerDisplay) {
        playerDisplay = userAddress.slice(0, 4) + '...' + userAddress.slice(-4);
        try {
            const users = (await client.fetchBulkUsersByEthOrSolAddress({ addresses: [userAddress] })) as any;
            const userData = users[userAddress.toLowerCase()]?.[0];
            if (userData?.username) {
                playerDisplay = userData.username;
            }
        } catch (e) {
            console.error('Error fetching username from Neynar:', e);
        }
    }

    if (playerDisplay && playerDisplay.startsWith('@')) {
        playerDisplay = playerDisplay.slice(1);
    }

    const referralUrl = `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo`;
    const castText = `🗺️ @${playerDisplay} just bought Treasure Chest #${landIndex} for ${cost} $CELO!\n\n🎁 Is #${landIndex} the winning chest? \n💎 Potential reward: ${potentialPrize} $CELO (5x)\n\nNow ${seatsFilled}/6 chests are opened. ${remaining} spots left before treasure is revealed!\n\nWill @${playerDisplay} win ${potentialPrize} $CELO? Or will someone else take the prize?\n\nJoin now and claim your chest 👇\n\n${referralUrl}\n\n#FindCelo #Celo #TreasureIsland /celo`;

    const response = await client.publishCast({
      signerUuid,
      text: castText,
      embeds: [{ url: referralUrl }],
      channelId: 'celo'
    } as any);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Neynar Post Join Cast Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
