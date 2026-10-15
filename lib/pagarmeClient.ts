// lib/pagarmeClient.ts
// Tokenização de cartão feita direto do navegador para a Pagar.me — o número,
// CVV e validade do cartão nunca passam pelo nosso servidor, só o token.
const TOKENS_URL = 'https://api.pagar.me/core/v5/tokens'

export class CardTokenError extends Error {}

export interface CardInput {
  number: string
  holderName: string
  expMonth: string
  expYear: string
  cvv: string
}

export async function tokenizeCard(card: CardInput): Promise<string> {
  const publicKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY
  if (!publicKey) {
    throw new CardTokenError('Pagamento com cartão não configurado (chave pública ausente)')
  }

  const res = await fetch(`${TOKENS_URL}?appId=${encodeURIComponent(publicKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'card',
      card: {
        number: card.number.replace(/\s/g, ''),
        holder_name: card.holderName,
        exp_month: card.expMonth,
        exp_year: card.expYear,
        cvv: card.cvv,
      },
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.id) {
    throw new CardTokenError(data?.message || 'Não foi possível validar o cartão')
  }
  return data.id as string
}
