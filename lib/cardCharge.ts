// lib/cardCharge.ts
import { createCardOrder } from './pagarme'
import { saveCharge } from './store'
import { getSettings } from './settings'

export interface CreateCardChargeInput {
  amount: number // em centavos
  description?: string
  cardToken: string
  installments: number
  customer: {
    name: string
    email: string
    document: string
    phone?: string
  }
  productId?: string | null
}

export async function createCardCharge(input: CreateCardChargeInput) {
  const token = process.env.PAGARME_API_KEY
  if (!token) {
    throw new Error('PAGARME_API_KEY não configurado')
  }

  const settings = await getSettings()
  const split = settings.split_recipients.map((r) => ({
    recipient_id: r.recipient_id,
    percentage: r.percentage,
  }))

  const result = await createCardOrder({
    amount: input.amount,
    description: input.description,
    customer: input.customer,
    cardToken: input.cardToken,
    installments: input.installments,
    split,
    token,
  })

  const checkoutId = crypto.randomUUID()
  await saveCharge({
    id: checkoutId,
    order_id: result.order_id,
    amount: result.amount,
    status: result.status,
    payment_method: 'credit_card',
    qr_code: null,
    qr_code_url: null,
    expires_at: null,
    card_brand: result.card_brand,
    card_last_four: result.card_last_four,
    description: input.description || null,
    institution_name: null,
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
    installments: result.installments,
    card_brand: result.card_brand,
    card_last_four: result.card_last_four,
    acquirer_message: result.acquirer_message,
    description: input.description || null,
  }
}
