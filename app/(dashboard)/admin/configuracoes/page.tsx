'use client'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { Card, CardTitle } from '@/components/Card'
import { Button, Input, Label, Spinner } from '@/components/Input'

interface SplitRecipient {
  id: string
  label: string
  recipient_id: string
  percentage: number
}

function emptyRecipient(): SplitRecipient {
  return { id: crypto.randomUUID(), label: '', recipient_id: '', percentage: 0 }
}

export default function ConfiguracoesPage() {
  const [recipients, setRecipients] = useState<SplitRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setRecipients(
            Array.isArray(d.split_recipients) && d.split_recipients.length > 0
              ? d.split_recipients
              : [emptyRecipient(), emptyRecipient()]
          )
        } else {
          setLoadError(d?.error || 'Falha ao carregar configurações')
        }
      })
      .catch(() => setLoadError('Falha ao carregar configurações'))
      .finally(() => setLoading(false))
  }, [])

  function updateRecipient(id: string, patch: Partial<SplitRecipient>) {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addRecipient() {
    setRecipients((prev) => [...prev, emptyRecipient()])
  }

  function removeRecipient(id: string) {
    setRecipients((prev) => prev.filter((r) => r.id !== id))
  }

  const total = recipients.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0)

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    setSaved(false)

    const payload = recipients
      .filter((r) => r.recipient_id.trim())
      .map((r) => ({
        id: r.id,
        label: r.label,
        recipient_id: r.recipient_id.trim(),
        percentage: Number(r.percentage),
      }))

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ split_recipients: payload }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (data?.ok) {
      setRecipients(data.split_recipients || [])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setSaveError(data?.error || `Erro HTTP ${res.status}`)
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground-strong">Configurações</h1>
          <p className="mt-1 text-sm text-muted">
            Defina os colaboradores que recebem uma porcentagem de cada PIX gerado (cobrança
            avulsa e produtos), via split de pagamento da Pagar.me.
          </p>
        </div>

        <Card>
          <CardTitle>💸 Divisão do pagamento (split)</CardTitle>
          <p className="mb-4 text-xs text-muted-2">
            Informe o ID do recebedor cadastrado na Pagar.me (ex.: <code>re_xxxxxxxxxxxxxxxx</code>)
            e a porcentagem de cada colaborador. O colaborador com a maior porcentagem assume a
            taxa da Pagar.me e eventuais chargebacks. Deixe a lista vazia para não aplicar split.
          </p>

          {loadError && <p className="animate-fade-in text-sm text-rose-400">{loadError}</p>}

          {loading && !loadError && (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          )}

          {!loading && !loadError && (
            <form onSubmit={onSave} className="space-y-4">
              <div className="space-y-3">
                {recipients.map((r, idx) => (
                  <div
                    key={r.id}
                    className="grid gap-3 rounded-lg border border-border bg-surface-muted/60 p-3 sm:grid-cols-[1fr_1fr_120px_auto]"
                  >
                    <div>
                      <Label htmlFor={`label-${r.id}`}>Colaborador</Label>
                      <Input
                        id={`label-${r.id}`}
                        placeholder={`Colaborador ${idx + 1}`}
                        value={r.label}
                        onChange={(e) => updateRecipient(r.id, { label: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`recipient-${r.id}`}>ID do recebedor</Label>
                      <Input
                        id={`recipient-${r.id}`}
                        placeholder="re_xxxxxxxxxxxxxxxx"
                        value={r.recipient_id}
                        onChange={(e) => updateRecipient(r.id, { recipient_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`percentage-${r.id}`}>Porcentagem</Label>
                      <Input
                        id={`percentage-${r.id}`}
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        placeholder="99"
                        value={r.percentage || ''}
                        onChange={(e) => updateRecipient(r.id, { percentage: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeRecipient(r.id)}
                        className="text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="ghost" onClick={addRecipient}>
                  + Adicionar colaborador
                </Button>
                <p className={`text-sm ${total === 100 ? 'text-muted-2' : 'text-amber-400'}`}>
                  Total: {total}% {total !== 100 && '(o ideal é somar 100%)'}
                </p>
              </div>

              {saveError && <p className="animate-fade-in text-sm text-rose-400">{saveError}</p>}

              <Button type="submit" disabled={saving}>
                {saving && <Spinner />}
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
              {saved && <span className="ml-3 animate-fade-in text-sm text-emerald-400">✓ Salvo</span>}
            </form>
          )}
        </Card>
      </main>
    </>
  )
}
