// lib/format.ts
export const PIX_STATUS_STYLES: Record<string, string> = {
  paid: 'bg-brand/15 text-brand ring-1 ring-brand/30',
  pending: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  failed: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30',
  canceled: 'bg-border-strong/40 text-muted ring-1 ring-border-strong/40',
}

export const PIX_STATUS_DOT: Record<string, string> = {
  paid: 'bg-brand',
  pending: 'bg-amber-400',
  failed: 'bg-rose-400',
  canceled: 'bg-muted-2',
}

export function pixStatusClass(status?: string | null) {
  return status
    ? PIX_STATUS_STYLES[status] ?? 'bg-surface-muted text-foreground ring-1 ring-border-strong'
    : 'bg-surface-muted text-foreground ring-1 ring-border-strong'
}

export function pixStatusDot(status?: string | null) {
  return status ? PIX_STATUS_DOT[status] ?? 'bg-muted-2' : 'bg-muted-2'
}

export function formatBRL(cents?: number | null) {
  return typeof cents === 'number'
    ? (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—'
}

export function maskPixCode(code?: string | null) {
  if (!code) return ''
  if (code.length <= 40) return code
  return `${code.slice(0, 20)}••••••••••••${code.slice(-16)}`
}
