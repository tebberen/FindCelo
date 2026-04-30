import { NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_URL || 'https://find-celo.vercel.app').replace(/\/$/, '')

  const frameResponse = {
    type: 'frame',
    version: '1',
    buttons: [
      {
        label: 'Open FindCelo',
        action: 'link',
        target: `${baseUrl}/`,
      },
    ],
    image: `${baseUrl}/images/background.png`,
    post_url: `${baseUrl}/api/frame`,
  }

  return NextResponse.json(frameResponse, {
    headers: CORS_HEADERS,
  })
}

export async function POST() {
  return GET()
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  })
}
