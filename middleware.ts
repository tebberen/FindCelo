import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const acceptHeader = request.headers.get('accept')

  if (request.nextUrl.pathname === '/' && acceptHeader?.includes('application/vnd.farcaster.snap+json')) {
    return NextResponse.rewrite(new URL('/snap', request.url))
  }

  const response = NextResponse.next()

  if (request.nextUrl.pathname === '/') {
    response.headers.set(
      'Link',
      '</snap>; rel="alternate"; type="application/vnd.farcaster.snap+json"'
    )
  }

  return response
}

export const config = {
  matcher: '/',
}
