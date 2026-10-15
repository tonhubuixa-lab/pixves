// proxy.ts
// Next.js 16: o antigo "middleware.ts" foi renomeado para "proxy.ts"
// (a função exportada também passou de `middleware` para `proxy`).
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth'

const PROTECTED = ['/admin']
const PUBLIC_ONLY = ['/login']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = await verifySession(token)

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (PUBLIC_ONLY.some((p) => pathname.startsWith(p)) && session) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
