// lib/pagarme.ts
const PAGARME_BASE = 'https://api.pagar.me/core/v5'

export class PagarmeError extends Error {
  status: number
  response: unknown
  constructor(message: string, status: number, response: unknown) {
    super(message)
    this.status = status
    this.response = response
  }
}

async function request(path: string, body: unknown, token: string, method = 'POST') {
  const auth = Buffer.from(`${token}:`).toString('base64')
  const res = await fetch(PAGARME_BASE + path, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw_response: text || 'Resposta vazia' }
  }

  if (!res.ok) {
    throw new PagarmeError(
      data?.message || 'Erro na Pagar.me',
      res.status,
      data
    )
  }
  return data
}

function mapOrder(data: any, fallbackAmount?: number) {
  const charge = data?.charges?.[0]
  const tx = charge?.last_transaction

  return {
    order_id: data?.id ?? null,
    amount: data?.amount ?? fallbackAmount ?? null,
    status: charge?.status ?? data?.status ?? null,
    qr_code: tx?.qr_code ?? null,
    qr_code_url: tx?.qr_code_url ?? null,
    expires_at: tx?.expires_at ?? null,
    raw: data,
  }
}

export interface SplitRule {
  recipient_id: string
  percentage: number
}

export interface CreatePixInput {
  amount: number // em centavos
  description?: string
  customer: {
    name: string
    email: string
    document: string
    phone?: string
  }
  split?: SplitRule[]
  token: string
}

// O recebedor com a maior porcentagem é tratado como principal: é ele quem
// absorve a taxa da Pagar.me, fica com o resto da divisão (arredondamento) e
// responde por chargebacks. Os demais recebem apenas o percentual configurado.
function buildSplit(split?: SplitRule[]) {
  if (!split || split.length === 0) return undefined
  const valid = split.filter((s) => s.recipient_id && s.percentage > 0)
  if (valid.length === 0) return undefined

  const primary = valid.reduce((max, s) => (s.percentage > max.percentage ? s : max), valid[0])

  return valid.map((s) => ({
    amount: s.percentage,
    recipient_id: s.recipient_id,
    type: 'percentage',
    options: {
      charge_processing_fee: s === primary,
      charge_remainder_fee: s === primary,
      liable: s === primary,
    },
  }))
}

function buildPhones(phone?: string) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length < 10) return undefined

  const countryCode = digits.length > 11 ? digits.slice(0, digits.length - 11) : '55'
  const local = digits.length > 11 ? digits.slice(digits.length - 11) : digits

  return {
    mobile_phone: {
      country_code: countryCode,
      area_code: local.slice(0, 2),
      number: local.slice(2),
    },
  }
}

export async function createPixOrder(input: CreatePixInput) {
  const { amount, description, customer, split, token } = input

  const payload = {
    items: [
      {
        amount,
        description: description || 'Pagamento',
        quantity: 1,
        code: '1',
      },
    ],
    customer: {
      name: customer.name,
      email: customer.email,
      document: customer.document,
      type: 'individual',
      phones: buildPhones(customer.phone),
    },
    payments: [
      {
        payment_method: 'pix',
        pix: { expires_in: 3600 },
        split: buildSplit(split),
      },
    ],
  }

  const data = await request('/orders', payload, token)
  return mapOrder(data, amount)
}

function sanitizeStatementDescriptor(text: string) {
  // A Pagar.me só aceita letras/números/espaço e até 13 caracteres para contas PSP.
  const clean = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .toUpperCase()
  return (clean || 'PAGAMENTO').slice(0, 13)
}

function mapCardOrder(data: any, fallbackAmount?: number) {
  const charge = data?.charges?.[0]
  const tx = charge?.last_transaction

  return {
    order_id: data?.id ?? null,
    amount: data?.amount ?? fallbackAmount ?? null,
    status: charge?.status ?? data?.status ?? null,
    installments: tx?.installments ?? null,
    card_brand: tx?.card?.brand ?? null,
    card_last_four: tx?.card?.last_four_digits ?? null,
    acquirer_message: tx?.acquirer_message ?? null,
    raw: data,
  }
}

export interface CreateCardInput {
  amount: number // em centavos
  description?: string
  customer: {
    name: string
    email: string
    document: string
    phone?: string
  }
  cardToken: string
  installments: number
  split?: SplitRule[]
  token: string
}

export async function createCardOrder(input: CreateCardInput) {
  const { amount, description, customer, cardToken, installments, split, token } = input

  const payload = {
    items: [
      {
        amount,
        description: description || 'Pagamento',
        quantity: 1,
        code: '1',
      },
    ],
    customer: {
      name: customer.name,
      email: customer.email,
      document: customer.document,
      type: 'individual',
      phones: buildPhones(customer.phone),
    },
    payments: [
      {
        payment_method: 'credit_card',
        credit_card: {
          installments,
          statement_descriptor: sanitizeStatementDescriptor(description || 'PAGAMENTO'),
          card_token: cardToken,
        },
        split: buildSplit(split),
      },
    ],
  }

  const data = await request('/orders', payload, token)
  return mapCardOrder(data, amount)
}

export async function getOrder(orderId: string, token: string) {
  const data = await request(`/orders/${orderId}`, null, token, 'GET')
  return mapOrder(data)
}

export interface CreatePaymentLinkInput {
  amount: number
  description?: string
  token: string
}

export async function createPaymentLink(input: CreatePaymentLinkInput) {
  const { amount, description, token } = input

  const payload = {
    is_building: false,
    name: 'Pagamento',
    type: 'order',
    payment_settings: {
      accepted_payment_methods: ['pix'],
      pix_settings: { expires_in: 3600 },
    },
    cart_settings: {
      items: [
        {
          amount,
          name: description || 'Pagamento',
          default_quantity: 1,
        },
      ],
    },
    max_paid_sessions: 1,
  }

  const data = await request('/paymentlinks', payload, token)
  return { id: data?.id ?? null, url: data?.url ?? null, raw: data }
}
