import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const acceptHeader = request.headers.get('accept')

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Accept, Content-Type',
      },
    })
  }

  let response: NextResponse

  // Existing logic for Farcaster Snap rewrite
  if (
    request.nextUrl.pathname === '/' &&
    acceptHeader?.includes('application/vnd.farcaster.snap+json')
  ) {
    response = NextResponse.rewrite(new URL('/snap', request.url))
  } else {
    response = NextResponse.next()
  }

  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Accept, Content-Type')

  // Existing logic for Link header on the main page
  if (request.nextUrl.pathname === '/') {
    response.headers.set(
      'Link',
      '</snap>; rel="alternate"; type="application/vnd.farcaster.snap+json"'
    )
  }

  return response
}

export const config = {
  matcher: '/:path*',
}
