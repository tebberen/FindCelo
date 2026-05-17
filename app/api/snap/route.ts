import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier');

  // Get table stats from contract (simplified for now)
  // You can replace these with actual contract calls later
  const stats = {
    bronzeFilled: 0,
    silverFilled: 0,
    goldFilled: 0,
    totalDistributed: 0
  };

  let title = "🏝️ Find the Celo Treasure";
  let description = "Choose your table and find the treasure!";

  if (tier === '0') {
    title = "💰 1 CELO Table";
    description = "6 lands. Winner takes 5 CELO!";
  } else if (tier === '1') {
    title = "💰 5 CELO Table";
    description = "6 lands. Winner takes 25 CELO!";
  } else if (tier === '2') {
    title = "💰 10 CELO Table";
    description = "6 lands. Winner takes 50 CELO!";
  }

  const snap = {
    version: "1.0",
    title: title,
    description: description,
    imageUrl: "https://find-celo.vercel.app/images/logo.png",
    button: {
      title: "🏝️ Play FindCelo",
      action: {
        type: "launch_miniapp",
        url: `https://find-celo.vercel.app/?tier=${tier || ''}`
      }
    }
  };

  return new NextResponse(JSON.stringify(snap), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.farcaster.snap+json",
      "Cache-Control": "public, max-age=60"
    }
  });
}
