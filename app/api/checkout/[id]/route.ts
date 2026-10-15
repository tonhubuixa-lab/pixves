// app/api/checkout/[id]/route.ts
import { NextResponse } from 'next/server'
import { getOrder } from '@/lib/pagarme'
import { rewriteBRCode } from '@/lib/brcode'
import { getCharge, updateCharge } from '@/lib/store'

export const runtime = 'nodejs'

const TERMINAL_STATUSES = ['paid', 'failed', 'canceled']

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const charge = await getCharge(id)
  if (!charge) {
    return NextResponse.json({ ok: false, error: 'Cobrança não encontrada' }, { status: 404 })
  }

  let current = charge
  const token = process.env.PAGARME_API_KEY
  if (token && charge.order_id && !TERMINAL_STATUSES.includes(charge.status || '')) {
    try {
      const fresh = await getOrder(charge.order_id, token)
      let qrCode = fresh.qr_code ?? charge.qr_code
      if (charge.institution_name && qrCode) {
        try {
          qrCode = rewriteBRCode(qrCode, { nome: charge.institution_name })
        } catch {
          // mantém o código sem a reescrita se ela falhar
        }
      }
      current =
        (await updateCharge(id, {
          status: fresh.status,
          qr_code: qrCode,
          qr_code_url: fresh.qr_code_url ?? charge.qr_code_url,
        })) ?? charge
    } catch {
      // mantém os dados já salvos se a consulta à Pagar.me falhar
    }
  }

  return NextResponse.json({
    ok: true,
    amount: current.amount,
    status: current.status,
    qr_code: current.qr_code,
    qr_code_url: current.qr_code_url,
    expires_at: current.expires_at,
    description: current.description,
    payer_name: current.payer_name,
    created_at: current.created_at,
  })
}
