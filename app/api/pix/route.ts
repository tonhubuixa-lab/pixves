// app/api/pix/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { PagarmeError } from '@/lib/pagarme'
import { createPixCharge } from '@/lib/pixCharge'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const amount = Number(body?.amount)

    if (!amount || amount < 100) {
      return NextResponse.json(
        { ok: false, error: 'Valor mínimo: R$ 1,00' },
        { status: 400 }
      )
    }

    if (!process.env.PAGARME_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'PAGARME_API_KEY não configurado' },
        { status: 500 }
      )
    }

    const customer = body?.customer ?? {}
    const result = await createPixCharge({
      amount,
      description: body?.description,
      institutionName: String(body?.institution_name || '').trim(),
      customer: {
        name: customer.name,
        email: customer.email,
        document: customer.document,
        phone: customer.phone,
      },
    })

    return NextResponse.json({ ok: true, ...result, qr_code_image: result.qr_code_url })
  } catch (err) {
    if (err instanceof PagarmeError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Erro ao gerar PIX',
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
