// app/api/config/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  const t = process.env.PAGARME_API_KEY || ''
  return NextResponse.json({
    ok: true,
    configured: !!t,
    pagarme_token_masked: t ? `${t.slice(0, 6)}…${t.slice(-4)}` : '',
    admin_user: process.env.ADMIN_USER || '',
  })
}
