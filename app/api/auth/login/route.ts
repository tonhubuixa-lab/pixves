// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { signSession, getSessionFromCookies, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

export async function GET() {
  const s = await getSessionFromCookies()
  return NextResponse.json({ ok: true, logged: !!s, user: s?.user ?? null })
}

export async function POST(req: Request) {
  const { user, pass } = await req.json().catch(() => ({}))

  const expectedUser = process.env.ADMIN_USER
  const expectedPass = process.env.ADMIN_PASS

  if (!expectedUser || !expectedPass) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_USER/ADMIN_PASS não configurados' },
      { status: 500 }
    )
  }

  if (!safeEqual(String(user ?? ''), expectedUser) ||
      !safeEqual(String(pass ?? ''), expectedPass)) {
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json(
      { ok: false, error: 'Credenciais inválidas' },
      { status: 401 }
    )
  }

  const token = await signSession(expectedUser)
  const res = NextResponse.json({ ok: true, user: expectedUser })
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { ...COOKIE_OPTIONS, maxAge: 0 })
  return res
}
