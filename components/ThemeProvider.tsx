'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'pix-admin-theme'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // theme fica 'dark' (igual ao servidor) até o efeito ler o localStorage,
  // evitando hydration mismatch; hydrated controla quando aplicar a classe.
  const [{ theme, hydrated }, setState] = useState<{ theme: Theme; hydrated: boolean }>({
    theme: 'dark',
    hydrated: false,
  })

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {
      /* localStorage indisponível */
    }
    // Sincroniza com localStorage (sistema externo) só após montar no
    // cliente — lido durante a renderização quebraria a hidratação, já
    // que o servidor não tem acesso a ele.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ theme: saved === 'light' ? 'light' : 'dark', hydrated: true })
  }, [])

  function setTheme(next: Theme) {
    setState({ theme: next, hydrated: true })
  }

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* localStorage indisponível */
    }
    setTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div className={`${hydrated && theme === 'light' ? 'light' : ''} min-h-screen bg-background text-foreground`}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return ctx
}
