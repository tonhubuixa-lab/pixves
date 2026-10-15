'use client'
import { useEffect, useState } from 'react'
import { Button } from './Input'
import { StatusBadge } from './StatusBadge'
import { formatBRL, maskPixCode } from '@/lib/format'

const TERMINAL_STATUSES = ['paid', 'failed', 'canceled']
const POLL_INTERVAL_MS = 5000

const STATUS_LABELS: Record<string, string> = {
  paid: 'pago',
  pending: 'aguardando pagamento',
  failed: 'falhou',
  canceled: 'cancelado',
}

interface CheckoutData {
  amount: number | null
  status: string | null
  qr_code: string | null
  qr_code_url: string | null
  expires_at: string | null
  description: string | null
  payer_name: string | null
}

export function CheckoutView({ id }: { id: string }) {
  const [data, setData] = useState<CheckoutData | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setLogoUrl(d?.ok ? d.logo_url || '' : ''))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout>

    async function load() {
      try {
        const res = await fetch(`/api/checkout/${id}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (json?.ok) {
          setData(json)
          if (!TERMINAL_STATUSES.includes(json.status || '')) {
            timer = setTimeout(load, POLL_INTERVAL_MS)
          }
        } else {
          setError(json?.error || 'Cobrança não encontrada')
        }
      } catch {
        if (active) setError('Falha ao carregar cobrança')
      }
    }

    load()
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [id])

  async function copy() {
    if (!data?.qr_code) return
    try {
      await navigator.clipboard.writeText(data.qr_code)
    } catch {
      /* fallback */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
          {error}
        </p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl shadow-black/30">
          <div className="skeleton mx-auto mb-4 h-12 w-32 rounded-lg" />
          <div className="skeleton mx-auto mb-4 h-4 w-40 rounded" />
          <div className="flex flex-col items-center gap-4">
            <div className="skeleton h-[200px] w-[200px] rounded-lg" />
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-6 w-28 rounded-full" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <div className="animate-fade-in rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur-sm">
        {logoUrl && !logoFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo"
            className="mx-auto mb-4 h-12 w-auto object-contain"
            onError={() => setLogoFailed(true)}
          />
        )}
        <h1 className="mb-1 text-center text-base font-semibold text-slate-100">
          {data.description || 'Pagamento via PIX'}
        </h1>
        {data.payer_name && (
          <p className="mb-4 text-center text-sm text-slate-400">Para {data.payer_name}</p>
        )}

        <div className="flex flex-col items-center gap-4">
          <div
            className={`flex h-[200px] w-[200px] items-center justify-center rounded-lg bg-white p-2 shadow-inner ring-2 ring-offset-2 ring-offset-slate-900 transition-colors ${
              data.status === 'pending'
                ? 'ring-amber-400/40'
                : data.status === 'paid'
                ? 'ring-brand/40'
                : 'ring-transparent'
            }`}
          >
            {data.qr_code_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.qr_code_url} alt="QR Code PIX" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-slate-400">sem QR</span>
            )}
          </div>

          <p className="text-center text-sm text-slate-400">
            Valor <strong className="text-slate-100">{formatBRL(data.amount)}</strong>
          </p>

          <StatusBadge status={data.status} label={data.status ? STATUS_LABELS[data.status] ?? data.status : undefined} />

          {data.expires_at && (
            <p className="text-center text-xs text-slate-500">
              Expira em {new Date(data.expires_at).toLocaleString('pt-BR')}
            </p>
          )}

          <div className="w-full select-none truncate rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 font-mono text-xs text-slate-400">
            {maskPixCode(data.qr_code)}
          </div>

          <Button onClick={copy} className="w-full">
            {copied ? '✓ Copiado' : '📋 Copiar código PIX'}
          </Button>
        </div>
      </div>
    </main>
  )
}
