'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle } from './Card'
import { Button, Input, Label, Select, Spinner } from './Input'
import { PixResult, type PixData } from './PixResult'
import { CardResult, type CardData } from './CardResult'
import { TrustBadges } from './TrustBadges'
import { formatBRL } from '@/lib/format'
import { tokenizeCard } from '@/lib/pagarmeClient'
import type { ProductRecord } from '@/lib/products'

type PaymentMethod = 'pix' | 'card'

export function ProductCheckoutView({ product }: { product: ProductRecord }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')
  const [quantity, setQuantity] = useState(1)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [installments, setInstallments] = useState(1)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PixData | null>(null)
  const [cardResult, setCardResult] = useState<CardData | null>(null)
  const [globalLogoUrl, setGlobalLogoUrl] = useState('')
  const [logoFailed, setLogoFailed] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setGlobalLogoUrl(d?.ok ? d.logo_url || '' : ''))
      .catch(() => {})
  }, [])

  // Logo única na página: a do produto, com a global como padrão.
  const logoUrl = product.logo_url || globalLogoUrl

  function changeQuantity(delta: number) {
    setQuantity((q) => Math.min(99, Math.max(1, q + delta)))
  }

  async function onSubmitPix() {
    const res = await fetch(`/api/products/${product.id}/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: { name, email, document, phone }, quantity }),
    })
    const data = await res.json().catch(() => ({}))
    if (data?.ok) {
      setResult(data)
    } else {
      setError(data?.error || `Erro HTTP ${res.status}`)
    }
  }

  async function onSubmitCard() {
    const [expMonth, expYear] = cardExpiry.split('/').map((p) => p.trim())
    if (!expMonth || !expYear) {
      setError('Informe a validade do cartão no formato MM/AA')
      return
    }

    let cardToken: string
    try {
      cardToken = await tokenizeCard({
        number: cardNumber,
        holderName: cardName,
        expMonth,
        expYear,
        cvv: cardCvv,
      })
    } catch (err) {
      setError((err as Error).message || 'Não foi possível validar o cartão')
      return
    }

    const res = await fetch(`/api/products/${product.id}/card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name, email, document, phone },
        quantity,
        installments,
        card_token: cardToken,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (data?.ok) {
      setCardResult(data)
    } else {
      setError(data?.error || `Erro HTTP ${res.status}`)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setCardResult(null)

    if (paymentMethod === 'pix') {
      await onSubmitPix()
    } else {
      await onSubmitCard()
    }

    setLoading(false)
  }

  const done = result || cardResult

  return (
    <div
      className={`${product.theme === 'light' ? 'light' : ''} min-h-screen bg-background text-foreground`}
    >
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="animate-fade-in text-center">
          {logoUrl && !logoFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={product.name}
              onError={() => setLogoFailed(true)}
              className="mx-auto h-10 w-auto object-contain"
            />
          )}
        </div>

        {product.subtitle && (
          <p className="animate-fade-in mx-auto mt-4 max-w-xl text-center text-sm text-muted">
            {product.subtitle}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="animate-fade-in space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-2">
              <span className={!done ? 'text-brand' : ''}>① Seus dados</span>
              <span className="h-px flex-1 bg-border" />
              <span className={done ? 'text-brand' : ''}>② Pagamento</span>
            </div>

            {!done ? (
              <Card>
                <CardTitle step={1}>Seus dados</CardTitle>
                <form onSubmit={onSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="document">CPF/CNPJ</Label>
                    <Input
                      id="document"
                      value={document}
                      onChange={(e) => setDocument(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-8888"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>Forma de pagamento</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          paymentMethod === 'pix'
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-border-strong text-muted hover:bg-surface-muted'
                        }`}
                      >
                        Pix
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          paymentMethod === 'card'
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-border-strong text-muted hover:bg-surface-muted'
                        }`}
                      >
                        Cartão de crédito
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="animate-fade-in space-y-3 rounded-lg border border-border bg-surface-muted/40 p-3">
                      <div>
                        <Label htmlFor="card-number">Número do cartão</Label>
                        <Input
                          id="card-number"
                          inputMode="numeric"
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          maxLength={19}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-name">Nome impresso no cartão</Label>
                        <Input
                          id="card-name"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="card-expiry">Validade (MM/AA)</Label>
                          <Input
                            id="card-expiry"
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            maxLength={7}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-cvv">CVV</Label>
                          <Input
                            id="card-cvv"
                            inputMode="numeric"
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            maxLength={4}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-installments">Parcelas</Label>
                          <Select
                            id="card-installments"
                            value={installments}
                            onChange={(e) => setInstallments(Number(e.target.value))}
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>
                                {n}x
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="animate-fade-in rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                      {error}
                    </p>
                  )}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Spinner />}
                    {loading
                      ? paymentMethod === 'card'
                        ? 'Processando…'
                        : 'Gerando…'
                      : paymentMethod === 'card'
                      ? 'Pagar com cartão'
                      : 'Ir para pagamento'}
                  </Button>
                </form>
              </Card>
            ) : result ? (
              <PixResult data={result} />
            ) : (
              cardResult && <CardResult data={cardResult} />
            )}
          </div>

          <div className="animate-fade-in space-y-4">
            <Card>
              <CardTitle>Resumo do pedido</CardTitle>
              <div className="flex items-start gap-3">
                {product.image_url && !imageFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    onError={() => setImageFailed(true)}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-border-strong"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-slate-950">
                    PIX
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground-strong">{product.name}</p>
                  <p className="text-xs text-muted-2">{formatBRL(product.amount)} / unidade</p>
                </div>
              </div>

              {!done && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted/60 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQuantity(-1)}
                      disabled={quantity <= 1}
                      aria-label="Diminuir quantidade"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border-strong text-foreground transition hover:border-muted-2 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-foreground-strong">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(1)}
                      disabled={quantity >= 99}
                      aria-label="Aumentar quantidade"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border-strong text-foreground transition hover:border-muted-2 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold text-foreground-strong">
                <span>Total</span>
                <span>{formatBRL(product.amount * quantity)}</span>
              </div>
            </Card>

            <TrustBadges />
          </div>
        </div>
      </main>
    </div>
  )
}
