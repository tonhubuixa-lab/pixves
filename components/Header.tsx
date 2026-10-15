'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  const linkCls = (href: string) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition ${
      pathname === href
        ? 'bg-surface-muted text-foreground-strong'
        : 'text-muted hover:text-foreground-strong hover:bg-surface-muted'
    }`

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-slate-950 shadow-md shadow-brand/30">
            PIX
          </span>
          <span className="text-foreground-strong">Gerador</span>
        </div>
        <nav className="flex items-center gap-1">
          <Link href="/admin/gerar" className={linkCls('/admin/gerar')}>Gerar PIX</Link>
          <Link href="/admin" className={linkCls('/admin')}>Painel</Link>
          <Link href="/admin/produtos" className={linkCls('/admin/produtos')}>Produtos</Link>
          <Link href="/admin/configuracoes" className={linkCls('/admin/configuracoes')}>Configurações</Link>
          <ThemeToggle />
          <button
            onClick={logout}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-foreground-strong"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  )
}
