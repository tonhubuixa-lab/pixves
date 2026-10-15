const BADGES = [
  {
    icon: '⚡',
    title: 'Pagamento instantâneo',
    text: 'O PIX é processado na hora — confirmação em segundos, 24h por dia.',
  },
  {
    icon: '🔒',
    title: 'Conexão segura',
    text: 'Seus dados trafegam em uma conexão criptografada (HTTPS).',
  },
  {
    icon: '🏦',
    title: 'Regulado pelo Banco Central',
    text: 'O PIX é o sistema de pagamentos instantâneos oficial do Bacen.',
  },
]

export function TrustBadges() {
  return (
    <div className="space-y-3">
      {BADGES.map((b) => (
        <div
          key={b.title}
          className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-4 shadow-xl shadow-black/10 backdrop-blur-sm"
        >
          <span className="text-lg leading-none">{b.icon}</span>
          <div>
            <p className="text-sm font-semibold text-foreground-strong">{b.title}</p>
            <p className="mt-0.5 text-xs text-muted">{b.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
