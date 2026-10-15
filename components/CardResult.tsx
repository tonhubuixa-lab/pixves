'use client'
import { StatusBadge } from './StatusBadge'
import { formatBRL } from '@/lib/format'

export interface CardData {
  order_id?: string | null
  amount?: number | null
  status?: string | null
  installments?: number | null
  card_brand?: string | null
  card_last_four?: string | null
  acquirer_message?: string | null
  description?: string | null
}

export function CardResult({ data }: { data: CardData }) {
  const approved = data.status === 'paid'
  const declined = data.status === 'failed' || data.status === 'refused'

  return (
    <div className="animate-fade-in rounded-2xl border border-border bg-surface/60 p-5 shadow-xl shadow-black/10 backdrop-blur-sm">
      <h2 className="mb-1 text-base font-semibold text-foreground-strong">
        {approved ? 'Pagamento aprovado' : declined ? 'Pagamento não aprovado' : 'Pagamento com cartão'}
      </h2>
      {data.description && <p className="mb-4 text-sm text-muted">{data.description}</p>}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>
            Valor <strong className="text-foreground-strong">{formatBRL(data.amount)}</strong>
          </span>
          <StatusBadge status={data.status} />
        </div>

        {(data.card_brand || data.card_last_four) && (
          <p className="text-xs text-muted-2">
            Cartão {data.card_brand || ''} {data.card_last_four ? `•••• ${data.card_last_four}` : ''}
            {data.installments && data.installments > 1 ? ` · ${data.installments}x` : ''}
          </p>
        )}

        <p className="break-words text-xs text-muted-2">
          Pedido <code className="text-foreground">{data.order_id ?? '—'}</code>
        </p>

        {declined && (
          <p className="animate-fade-in rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
            {data.acquirer_message || 'O cartão foi recusado. Tente outro cartão ou use o PIX.'}
          </p>
        )}
      </div>
    </div>
  )
}
