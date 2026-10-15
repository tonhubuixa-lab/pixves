'use client'
import { useState } from 'react'
import Header from '@/components/Header'
import { Card, CardTitle } from '@/components/Card'
import { Button, Input, Label, Spinner } from '@/components/Input'
import { PixResult, type PixData } from '@/components/PixResult'

function parseAmountToCents(v: string) {
  const normalized = v.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export default function GerarPixPage() {
  const [amountInput, setAmountInput] = useState('')
  const [description, setDescription] = useState('')
  const [institutionName, setInstitutionName] = useState('Pagar me Instituição de P')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unauthenticated, setUnauthenticated] = useState(false)
  const [result, setResult] = useState<PixData | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUnauthenticated(false)
    setResult(null)

    const res = await fetch('/api/pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseAmountToCents(amountInput),
        description,
        institution_name: institutionName,
        customer: { name, email, document, phone },
      }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)

    if (data?.ok) {
      setResult(data)
    } else {
      setUnauthenticated(res.status === 401)
      setError(data?.error || `Erro HTTP ${res.status}`)
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground-strong">Gerar cobrança PIX</h1>
          <p className="mt-1 text-sm text-muted">
            Preencha os dados abaixo para criar um QR Code PIX via Pagar.me.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardTitle step={1}>Valor e descrição</CardTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="25,90"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Pagamento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="institution-name">Nome da instituição (opcional)</Label>
                <Input
                  id="institution-name"
                  placeholder="Deixe em branco para usar o padrão da Pagar.me"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  maxLength={25}
                />
                <p className="mt-1 text-xs text-muted-2">
                  Altera apenas o texto do código copia-e-cola. O app do banco de quem paga
                  normalmente mostra o nome real cadastrado na chave PIX.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle step={2}>Dados do cliente</CardTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
            </div>
          </Card>

          {error && (
            <p className="animate-fade-in rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {error}
              {unauthenticated && (
                <>
                  {' '}
                  <a href="/login" className="font-medium text-rose-300 underline hover:text-rose-200">
                    Fazer login
                  </a>
                </>
              )}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Spinner />}
            {loading ? 'Gerando…' : 'Gerar PIX'}
          </Button>
        </form>

        {result && <PixResult data={result} />}
      </main>
    </>
  )
}
