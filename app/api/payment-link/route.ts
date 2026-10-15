// app/api/payment-link/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { createPaymentLink, PagarmeError } from '@/lib/pagarme'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const amount = Math.round(
      Number(String(body?.amount ?? '').replace(/\./g, '').replace(',', '.')) * 100
    )
    if (!amount || amount < 100) {
      return NextResponse.json(
        { ok: false, error: 'Valor mínimo: R$ 1,00' },
        { status: 400 }
      )
    }

    const token = process.env.PAGARME_API_KEY
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'PAGARME_API_KEY não configurado' },
        { status: 500 }
      )
    }

    const result = await createPaymentLink({
      amount,
      description: body?.description,
      token,
    })

    return NextResponse.json({
      ok: true,
      id: result.id,
      url: result.url,
      pagarme_response: result.raw,
    })
  } catch (err) {
    if (err instanceof PagarmeError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Erro ao criar link',
          http_status: err.status,
          pagarme_response: err.response,
        },
        { status: err.status }
      )
    }
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
