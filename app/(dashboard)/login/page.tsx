'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, Spinner } from '@/components/Input'
import { Card, CardTitle } from '@/components/Card'

export default function LoginPage() {
  const router = useRouter()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (data?.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setMsg(data?.error || `Erro HTTP ${res.status}`)
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/10 blur-3xl"
      />
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 animate-fade-in">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-slate-950 shadow-md shadow-brand/30">
            PIX
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground-strong">Gerador</span>
        </div>
        <Card>
          <CardTitle>🔐 Acesso restrito</CardTitle>
          <p className="mb-4 text-xs text-muted">Informe suas credenciais.</p>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="user">Usuário</Label>
              <Input
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <Label htmlFor="pass">Senha</Label>
              <div className="relative">
                <Input
                  id="pass"
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="current-password"
                  className="pr-16"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-muted transition hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? 'ocultar' : 'exibir'}
                </button>
              </div>
            </div>

            {msg && (
              <p className="animate-fade-in rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                {msg}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Spinner />}
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}
