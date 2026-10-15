// components/StatusBadge.tsx
import { pixStatusClass, pixStatusDot } from '@/lib/format'

export function StatusBadge({
  status,
  label,
}: {
  status?: string | null
  label?: string
}) {
  const pulsing = status === 'pending'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${pixStatusClass(
        status
      )}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${pixStatusDot(status)} ${
          pulsing ? 'animate-soft-pulse' : ''
        }`}
      />
      {label ?? status ?? '—'}
    </span>
  )
}
