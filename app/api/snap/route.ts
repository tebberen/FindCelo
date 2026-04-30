import { NextResponse } from 'next/server'

export async function GET() {
  const snapResponse = {
    "type": "snap",
    "version": "0.1.0",
    "image": "https://find-celo.vercel.app/images/background.png",
    "buttons": [
      {
        "label": "Play Now",
        "action": {
          "type": "link",
          "target": "https://find-celo.vercel.app"
        }
      }
    ]
  }

  return NextResponse.json(snapResponse, {
    headers: {
      'Content-Type': 'application/vnd.farcaster.snap+json',
    }
  })
}

export async function POST() {
  return GET();
}
