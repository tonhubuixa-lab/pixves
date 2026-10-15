// lib/pixCharge.ts
import { createPixOrder } from './pagarme'
import { rewriteBRCode } from './brcode'
import { saveCharge } from './store'
import { getSettings } from './settings'

export interface CreatePixChargeInput {
  amount: number // em centavos
  description?: string
  institutionName?: string | null
  customer: {
    name: string
    email: string
    document: string
    phone?: string
  }
  productId?: string | null
}

export async function createPixCharge(input: CreatePixChargeInput) {
  const token = process.env.PAGARME_API_KEY
  if (!token) {
    throw new Error('PAGARME_API_KEY não configurado')
  }

  const settings = await getSettings()
  const split = settings.split_recipients.map((r) => ({
    recipient_id: r.recipient_id,
    percentage: r.percentage,
  }))

  const result = await createPixOrder({
    amount: input.amount,
    description: input.description,
    customer: input.customer,
    split,
    token,
  })

  let qrCode = result.qr_code
  if (input.institutionName && qrCode) {
    try {
      qrCode = rewriteBRCode(qrCode, { nome: input.institutionName })
    } catch {
      // mantém o código original da Pagar.me se a reescrita falhar
    }
  }

  const checkoutId = crypto.randomUUID()
  await saveCharge({
    id: checkoutId,
    order_id: result.order_id,
    amount: result.amount,
    status: result.status,
    qr_code: qrCode,
    qr_code_url: result.qr_code_url,
    expires_at: result.expires_at,
    description: input.description || null,
    institution_name: input.institutionName || null,
    payer_name: input.customer.name || null,
    payer_email: input.customer.email || null,
    payer_document: input.customer.document || null,
    product_id: input.productId || null,
    created_at: new Date().toISOString(),
  })

  return {
    order_id: result.order_id,
    amount: result.amount,
    status: result.status,
    qr_code: qrCode,
    qr_code_url: result.qr_code_url,
    expires_at: result.expires_at,
    description: input.description || null,
    checkout_url: `/checkout/${checkoutId}`,
    pagarme_response: result.raw,
  }
}
