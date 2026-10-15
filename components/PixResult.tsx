'use client'
import { useState } from 'react'
import { Button } from './Input'
import { StatusBadge } from './StatusBadge'
import { formatBRL, maskPixCode } from '@/lib/format'

export interface PixData {
  order_id?: string | null
  amount?: number
  status?: string | null
  qr_code?: string | null
  qr_code_url?: string | null
  expires_at?: string | null
  checkout_url?: string | null
  description?: string | null
}

export function PixResult({ data }: { data: PixData }) {
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  async function copy() {
    if (!data.qr_code) return
    try {
      await navigator.clipboard.writeText(data.qr_code)
    } catch {
      /* fallback */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function copyLink() {
    if (!data.checkout_url) return
    try {
      await navigator.clipboard.writeText(new URL(data.checkout_url, window.location.origin).toString())
    } catch {
      /* fallback */
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 1500)
  }

  return (
    <div className="animate-fade-in rounded-2xl border border-border bg-surface/60 p-5 shadow-xl shadow-black/10 backdrop-blur-sm">
      <h2 className="mb-1 text-base font-semibold text-foreground-strong">PIX gerado</h2>
      {data.description && (
        <p className="mb-4 text-sm text-muted">{data.description}</p>
      )}
      <div
        className={`grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] ${!data.description ? 'mt-4' : ''}`}
      >
        <div className="mx-auto flex h-[220px] w-[220px] shrink-0 items-center justify-center rounded-lg bg-white p-2 shadow-inner md:mx-0">
          {data.qr_code_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.qr_code_url} alt="QR Code PIX" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-muted">sem QR</span>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>
              Valor <strong className="text-foreground-strong">{formatBRL(data.amount)}</strong>
            </span>
            <StatusBadge status={data.status} />
          </div>
          <p className="break-words text-xs text-muted-2">
            Pedido <code className="text-foreground">{data.order_id ?? '—'}</code> · Expira em{' '}
            {data.expires_at ? new Date(data.expires_at).toLocaleString('pt-BR') : '—'}
          </p>
          <div className="min-w-0 select-none truncate rounded-lg border border-border-strong bg-surface-muted/60 px-3 py-2 font-mono text-xs text-muted">
            {maskPixCode(data.qr_code)}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={copy}>{copied ? '✓ Copiado' : '📋 Copiar código'}</Button>
            {data.qr_code_url && (
              <a
                href={data.qr_code_url}
                target="_blank"
                rel="noopener"
                className="text-sm text-sky-400 transition hover:text-sky-300 hover:underline"
              >
                Abrir QR
              </a>
            )}
          </div>
          {data.checkout_url && (
            <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-muted/60 px-3 py-2">
              <a
                href={data.checkout_url}
                target="_blank"
                rel="noopener"
                className="min-w-0 flex-1 truncate text-sm text-sky-400 hover:underline"
              >
                {typeof window !== 'undefined'
                  ? new URL(data.checkout_url, window.location.origin).toString()
                  : data.checkout_url}
              </a>
              <Button type="button" variant="ghost" onClick={copyLink}>
                {linkCopied ? '✓' : '🔗 Copiar link'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
