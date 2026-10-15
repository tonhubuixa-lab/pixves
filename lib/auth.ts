// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE = 'pxauth'
const ALG = 'HS256'

function secretKey() {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET não configurado')
  return new TextEncoder().encode(s)
}

export async function signSession(user: string, maxAgeSec = 60 * 60 * 8) {
  const now = Math.floor(Date.now() / 1000)
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt(now)
    .setExpirationTime(now + maxAgeSec)
    .sign(secretKey())
}

export async function verifySession(token: string | undefined) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    return payload as { user: string; exp: number }
  } catch {
    return null
  }
}

export async function getSessionFromCookies() {
  // Next.js 16: `cookies()` é assíncrono e precisa de await.
  const token = (await cookies()).get(COOKIE)?.value
  return await verifySession(token)
}

export async function requireSession() {
  const s = await getSessionFromCookies()
  if (!s) throw new Error('UNAUTHENTICATED')
  return s
}

export const COOKIE_NAME = COOKIE
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 8,
}
