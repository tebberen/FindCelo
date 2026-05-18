import { NextRequest, NextResponse } from 'next/server';
import { getFidByAddress, getTokenByFid, isTxProcessed, markTxProcessed } from '@/src/lib/storage';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { createPublicClient, http, decodeEventLog, formatEther } from 'viem';
import { celo } from 'viem/chains';
import { CONTRACT_ADDRESS, FIND_CELO_ABI } from '@/src/constants';

const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHash } = body;

    if (!txHash) {
      return NextResponse.json({ error: 'Missing txHash' }, { status: 400 });
    }

    if (isTxProcessed(txHash)) {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    console.log(`Verifying transaction ${txHash} on-chain...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

    if (!receipt || receipt.status !== 'success') {
       return NextResponse.json({ error: 'Transaction failed or not found' }, { status: 400 });
    }

    // Extract TableFilled event
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
      return NextResponse.json({ success: true, message: 'No TableFilled event in this transaction' });
    }

    const decoded = decodeEventLog({
      abi: FIND_CELO_ABI,
      data: tableFilledLog.data,
      topics: tableFilledLog.topics,
    }) as any;

    const winner = decoded.args.winner;
    const prize = formatEther(decoded.args.prize);
    const winningLand = Number(decoded.args.winningLand);
    const tableType = decoded.args.tableType;

    // Autonomous Agent: Post Winner Announcement Cast
    try {
      const neynarApiKey = process.env.NEYNAR_API_KEY || '';
      const signerUuid = process.env.NEYNAR_SIGNER_UUID || '';

      if (neynarApiKey && signerUuid) {
        const client = new NeynarAPIClient({ apiKey: neynarApiKey });

        // Fetch winner username for better cast text
        const response: any = await client.fetchBulkUsersByEthOrSolAddress({ addresses: [winner] });
        const userData = response[winner.toLowerCase()]?.[0];
        const winnerDisplay = userData?.username ? `@${userData.username}` : `${winner.slice(0, 6)}...${winner.slice(-4)}`;

        const castText = `🏆 Congratulations ${winnerDisplay}! Won ${prize} CELO on FindCelo! 🏝️💰\n\nThe treasure was hidden in Land #${winningLand}.\n\nPlay now: 👇\nhttps://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo #FindCelo #Celo`;

        await client.publishCast({
          signerUuid,
          text: castText,
          embeds: [{ url: 'https://find-celo.vercel.app' }] as any
        });
        console.log('Autonomous winner announcement posted');
      }
    } catch (err) {
      console.error('Failed to post autonomous winner announcement:', err);
    }

    // Fetch the 6 players of this game from on-chain logs for maximum security and reliability
    const fromBlock = receipt.blockNumber > 500n ? receipt.blockNumber - 500n : 0n;
    const joinLogs = await publicClient.getLogs({
      address: CONTRACT_ADDRESS as `0x${string}`,
      event: FIND_CELO_ABI.find((x: any) => x.name === 'GameJoined') as any,
      fromBlock,
      toBlock: receipt.blockNumber,
    });

    // Filter by tableType and take the last 6 joining events
    const players = joinLogs
      .filter((log: any) => log.args.tableType === tableType)
      .slice(-6)
      .map((log: any) => log.args.player);

    const uniquePlayers = Array.from(new Set(players));

    // Notification promises
    const notifications = [];

    for (const playerAddress of uniquePlayers) {
      if (!playerAddress || playerAddress === '0x0000000000000000000000000000000000000000') continue;

      const fid = getFidByAddress(playerAddress as string);
      if (!fid) {
        console.log(`No FID found for address ${playerAddress}, skipping notification.`);
        continue;
      }

      const tokenData = getTokenByFid(fid);
      if (!tokenData) {
        console.log(`No notification token found for FID ${fid}, skipping.`);
        continue;
      }

      const isWinner = (playerAddress as string).toLowerCase() === winner.toLowerCase();

      const title = isWinner ? "🎉 YOU WON!" : "💀 TREASURE FOUND!";
      const notificationBody = isWinner
        ? `You won ${prize} CELO on FindCelo! Tap to play again.`
        : `Treasure was on Land #${winningLand}. You lost ${Number(prize) / 5} CELO. Try again!`;

      notifications.push(
        fetch(tokenData.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationToken: tokenData.token,
            title,
            body: notificationBody,
            targetUrl: 'https://find-celo.vercel.app',
          }),
        }).then(res => res.json().catch(() => ({})))
      );

      // Feature 2: Send Snap DM
      notifications.push(
        fetch(`${process.env.NEXT_PUBLIC_URL || 'https://find-celo.vercel.app'}/api/send-result-snap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            winnerAddress: winner,
            prize,
            winningLand,
            didWin: isWinner,
            userFid: fid
          }),
        }).then(res => res.json().catch(() => ({})))
      );
    }

    if (notifications.length > 0) {
      await Promise.all(notifications);
      console.log(`Sent ${notifications.length} notifications for game resolved in tx ${txHash}`);
    }

    markTxProcessed(txHash);

    return NextResponse.json({ success: true, sent: notifications.length });
  } catch (error) {
    console.error('Error in notify route:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
