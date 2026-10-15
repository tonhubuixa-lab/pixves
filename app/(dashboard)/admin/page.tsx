'use client'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { Card, CardTitle } from '@/components/Card'
import { Button, Input, Label, Select, Spinner, Textarea } from '@/components/Input'
import { StatusBadge } from '@/components/StatusBadge'
import { ImagePreview, SafeImage } from '@/components/SafeImage'
import type { TipoChavePix } from '@/lib/brcode'
import { formatBRL } from '@/lib/format'

interface ChargeHistoryItem {
  id: string
  created_at: string
  payer_name: string | null
  amount: number | null
  status: string | null
  description: string | null
  checkout_url: string
}

interface ConfigData {
  configured: boolean
  pagarme_token_masked: string
  admin_user: string
}

export default function AdminPage() {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [configError, setConfigError] = useState('')

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setConfig(d)
        else setConfigError(d?.error || 'Falha ao carregar configuração')
      })
      .catch(() => setConfigError('Falha ao carregar configuração'))
  }, [])

  const [logoUrl, setLogoUrl] = useState('')
  const [logoSaved, setLogoSaved] = useState('')
  const [savingLogo, setSavingLogo] = useState(false)
  const [logoError, setLogoError] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setLogoUrl(d.logo_url || '')
          setLogoSaved(d.logo_url || '')
        }
      })
      .catch(() => {})
  }, [])

  async function saveLogo(e: React.FormEvent) {
    e.preventDefault()
    setSavingLogo(true)
    setLogoError('')
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo_url: logoUrl }),
    })
    const data = await res.json().catch(() => ({}))
    setSavingLogo(false)
    if (data?.ok) {
      setLogoSaved(data.logo_url || '')
    } else {
      setLogoError(data?.error || `Erro HTTP ${res.status}`)
    }
  }

  const [linkAmount, setLinkAmount] = useState('')
  const [linkDescription, setLinkDescription] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  async function createLink(e: React.FormEvent) {
    e.preventDefault()
    setLinkLoading(true)
    setLinkError('')
    setLinkUrl('')
    const res = await fetch('/api/payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: linkAmount, description: linkDescription }),
    })
    const data = await res.json().catch(() => ({}))
    setLinkLoading(false)
    if (data?.ok) setLinkUrl(data.url || '')
    else setLinkError(data?.error || `Erro HTTP ${res.status}`)
  }

  const [charges, setCharges] = useState<ChargeHistoryItem[]>([])
  const [chargesError, setChargesError] = useState('')
  const [chargesLoading, setChargesLoading] = useState(true)

  useEffect(() => {
    fetch('/api/charges')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setCharges(d.charges)
        else setChargesError(d?.error || 'Falha ao carregar histórico')
      })
      .catch(() => setChargesError('Falha ao carregar histórico'))
      .finally(() => setChargesLoading(false))
  }, [])

  const [tipoChave, setTipoChave] = useState<TipoChavePix>('cpf')
  const [chave, setChave] = useState('')
  const [nome, setNome] = useState('')
  const [cidade, setCidade] = useState('')
  const [valor, setValor] = useState('')
  const [txid, setTxid] = useState('')
  const [descricao, setDescricao] = useState('')
  const [brLoading, setBrLoading] = useState(false)
  const [brError, setBrError] = useState('')
  const [brCode, setBrCode] = useState('')
  const [brQrImage, setBrQrImage] = useState('')

  const chavePlaceholder: Record<TipoChavePix, string> = {
    cpf: '000.000.000-00',
    telefone: '(11) 99999-8888',
    email: 'nome@exemplo.com',
    aleatoria: '123e4567-e89b-12d3-a456-426614174000',
  }

  async function generateBrCode(e: React.FormEvent) {
    e.preventDefault()
    setBrLoading(true)
    setBrError('')
    setBrCode('')
    setBrQrImage('')
    const res = await fetch('/api/brcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipoChave, chave, nome, cidade, valor, txid, descricao }),
    })
    const data = await res.json().catch(() => ({}))
    setBrLoading(false)
    if (data?.ok) {
      setBrCode(data.code || '')
      setBrQrImage(data.qr_code_image || '')
    } else {
      setBrError(data?.error || `Erro HTTP ${res.status}`)
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground-strong">Painel administrativo</h1>
          <p className="mt-1 text-sm text-muted">Status da integração e ferramentas avançadas.</p>
        </div>

        <Card>
          <CardTitle>⚙️ Configuração</CardTitle>
          {configError && <p className="animate-fade-in text-sm text-rose-400">{configError}</p>}
          {config ? (
            <dl className="animate-fade-in grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-2">Usuário admin</dt>
                <dd className="text-foreground">{config.admin_user || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-2">Pagar.me</dt>
                <dd>
                  <StatusBadge
                    status={config.configured ? 'paid' : 'failed'}
                    label={config.configured ? 'configurado' : 'não configurado'}
                  />
                </dd>
              </div>
              {config.pagarme_token_masked && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-2">Token</dt>
                  <dd className="font-mono text-foreground">{config.pagarme_token_masked}</dd>
                </div>
              )}
            </dl>
          ) : (
            !configError && (
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="skeleton h-10 rounded-lg" />
                <div className="skeleton h-10 rounded-lg" />
              </div>
            )
          )}
        </Card>

        <Card>
          <CardTitle>🖼️ Logo do checkout</CardTitle>
          <p className="mb-3 text-xs text-muted-2">
            Aparece no topo da página de cobrança avulsa e do checkout de produtos.
          </p>
          <form onSubmit={saveLogo} className="flex flex-wrap items-end gap-3">
            {logoSaved && (
              <SafeImage
                src={logoSaved}
                alt="Logo atual"
                className="h-10 w-auto rounded-md object-contain"
              />
            )}
            <div className="min-w-[240px] flex-1">
              <Label htmlFor="logo-url">URL da imagem</Label>
              <Input
                id="logo-url"
                type="url"
                placeholder="https://exemplo.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
              <ImagePreview url={logoUrl} className="h-8 w-auto px-1" />
            </div>
            <Button type="submit" disabled={savingLogo}>
              {savingLogo && <Spinner />}
              {savingLogo ? 'Salvando…' : 'Salvar'}
            </Button>
          </form>
          {logoError && <p className="animate-fade-in mt-2 text-sm text-rose-400">{logoError}</p>}
        </Card>

        <Card>
          <CardTitle step={1}>Link de pagamento</CardTitle>
          <form onSubmit={createLink} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="link-amount">Valor (R$)</Label>
                <Input
                  id="link-amount"
                  inputMode="decimal"
                  placeholder="25,90"
                  value={linkAmount}
                  onChange={(e) => setLinkAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="link-description">Descrição</Label>
                <Input
                  id="link-description"
                  placeholder="Pagamento"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                />
              </div>
            </div>
            {linkError && <p className="animate-fade-in text-sm text-rose-400">{linkError}</p>}
            <Button type="submit" variant="alt" disabled={linkLoading}>
              {linkLoading && <Spinner />}
              {linkLoading ? 'Criando…' : 'Criar link'}
            </Button>
            {linkUrl && (
              <p className="animate-fade-in break-all rounded-lg border border-border bg-surface-muted/60 px-3 py-2 text-sm">
                <a href={linkUrl} target="_blank" rel="noopener" className="text-sky-400 hover:underline">
                  {linkUrl}
                </a>
              </p>
            )}
          </form>
        </Card>

        <Card>
          <CardTitle step={2}>BR Code manual</CardTitle>
          <form onSubmit={generateBrCode} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="tipo-chave">Tipo de chave</Label>
                <Select
                  id="tipo-chave"
                  value={tipoChave}
                  onChange={(e) => setTipoChave(e.target.value as TipoChavePix)}
                >
                  <option value="cpf">CPF</option>
                  <option value="telefone">Telefone</option>
                  <option value="email">E-mail</option>
                  <option value="aleatoria">Aleatória</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="chave">Chave PIX</Label>
                <Input
                  id="chave"
                  placeholder={chavePlaceholder[tipoChave]}
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valor">Valor (opcional)</Label>
                <Input
                  id="valor"
                  inputMode="decimal"
                  placeholder="25.90"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome do recebedor</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="txid">TxID</Label>
                <Input id="txid" value={txid} onChange={(e) => setTxid(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>
            </div>
            {brError && <p className="animate-fade-in text-sm text-rose-400">{brError}</p>}
            <Button type="submit" variant="ghost" disabled={brLoading}>
              {brLoading && <Spinner />}
              {brLoading ? 'Gerando…' : 'Gerar BR Code'}
            </Button>
            {brCode && (
              <div className="animate-fade-in grid gap-4 sm:grid-cols-[160px_1fr]">
                {brQrImage && (
                  <div className="flex h-[160px] w-[160px] items-center justify-center rounded-lg bg-white p-2 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={brQrImage} alt="QR Code PIX" className="h-full w-full object-contain" />
                  </div>
                )}
                <Textarea readOnly rows={3} value={brCode} />
              </div>
            )}
          </form>
        </Card>

        <Card>
          <CardTitle step={3}>Histórico de cobranças PIX</CardTitle>
          {chargesError && <p className="animate-fade-in text-sm text-rose-400">{chargesError}</p>}
          {chargesLoading && !chargesError && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-9 rounded-lg" />
              ))}
            </div>
          )}
          {!chargesLoading && !chargesError && charges.length === 0 && (
            <p className="text-sm text-muted-2">Nenhuma cobrança gerada ainda.</p>
          )}
          {charges.length > 0 && (
            <div className="animate-fade-in -mx-5 overflow-x-auto px-5">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs tracking-wide text-muted-2 uppercase">
                    <th className="py-2 pr-3 font-medium">Data/hora</th>
                    <th className="py-2 pr-3 font-medium">Pagante</th>
                    <th className="py-2 pr-3 font-medium">Valor</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/60 text-foreground transition-colors hover:bg-border/30"
                    >
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted">
                        {new Date(c.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 pr-3">{c.payer_name || '—'}</td>
                      <td className="py-2 pr-3">{formatBRL(c.amount)}</td>
                      <td className="py-2 pr-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-2 pr-3">
                        <a
                          href={c.checkout_url}
                          target="_blank"
                          rel="noopener"
                          className="text-sky-400 hover:underline"
                        >
                          abrir
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </>
  )
}
