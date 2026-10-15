// app/api/charges/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { listCharges } from '@/lib/store'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const all = await listCharges()
    const charges = all.map((c) => ({
      id: c.id,
      created_at: c.created_at,
      payer_name: c.payer_name,
      amount: c.amount,
      status: c.status,
      description: c.description,
      checkout_url: `/checkout/${c.id}`,
    }))

    return NextResponse.json({ ok: true, charges })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
