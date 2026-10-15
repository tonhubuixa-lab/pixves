// components/Card.tsx
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface/60 p-5 shadow-xl shadow-black/10 backdrop-blur-sm ${className}`}
    >
      {children}
    </section>
  )
}

export function CardTitle({
  step,
  children,
}: {
  step?: string | number
  children: React.ReactNode
}) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold text-foreground-strong mb-3">
      {step !== undefined && (
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand text-xs font-bold ring-1 ring-brand/30">
          {step}
        </span>
      )}
      {children}
    </h2>
  )
}
