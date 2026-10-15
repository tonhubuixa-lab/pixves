'use client'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { Card, CardTitle } from '@/components/Card'
import { Button, Input, Label, Select, Spinner } from '@/components/Input'
import { ImagePreview, SafeImage } from '@/components/SafeImage'
import { formatBRL } from '@/lib/format'
import type { ProductTheme } from '@/lib/products'

interface Product {
  id: string
  name: string
  amount: number
  institution_name: string | null
  image_url: string | null
  logo_url: string | null
  subtitle: string | null
  page_title: string | null
  favicon_url: string | null
  theme: ProductTheme
  created_at: string
}

interface ProductFormState {
  institutionName: string
  imageUrl: string
  logoUrl: string
  subtitle: string
  pageTitle: string
  faviconUrl: string
  theme: ProductTheme
}

const emptyForm: ProductFormState = {
  institutionName: '',
  imageUrl: '',
  logoUrl: '',
  subtitle: '',
  pageTitle: '',
  faviconUrl: '',
  theme: 'dark',
}

export default function ProdutosPage() {
  const [name, setName] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState<ProductFormState>(emptyForm)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  function parseAmountToCents(v: string) {
    const normalized = v.replace(/\./g, '').replace(',', '.')
    const n = Number(normalized)
    return Number.isFinite(n) ? Math.round(n * 100) : 0
  }

  function loadProducts() {
    return fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setProducts(d.products)
          setListError('')
        } else {
          setListError(d?.error || 'Falha ao carregar produtos')
        }
      })
      .catch(() => setListError('Falha ao carregar produtos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        amount: parseAmountToCents(amountInput),
        institution_name: form.institutionName,
        image_url: form.imageUrl,
        logo_url: form.logoUrl,
        subtitle: form.subtitle,
        page_title: form.pageTitle,
        favicon_url: form.faviconUrl,
        theme: form.theme,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setCreating(false)
    if (data?.ok) {
      setName('')
      setAmountInput('')
      setForm(emptyForm)
      await loadProducts()
    } else {
      setCreateError(data?.error || `Erro HTTP ${res.status}`)
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setEditForm({
      institutionName: p.institution_name || '',
      imageUrl: p.image_url || '',
      logoUrl: p.logo_url || '',
      subtitle: p.subtitle || '',
      pageTitle: p.page_title || '',
      faviconUrl: p.favicon_url || '',
      theme: p.theme || 'dark',
    })
    setEditError('')
  }

  function cancelEdit() {
    setEditingId('')
    setEditForm(emptyForm)
    setEditError('')
  }

  async function saveEdit(id: string) {
    setSavingEdit(true)
    setEditError('')
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institution_name: editForm.institutionName,
        image_url: editForm.imageUrl,
        logo_url: editForm.logoUrl,
        subtitle: editForm.subtitle,
        page_title: editForm.pageTitle,
        favicon_url: editForm.faviconUrl,
        theme: editForm.theme,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSavingEdit(false)
    if (data?.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? data.product : p)))
      cancelEdit()
    } else {
      setEditError(data?.error || `Erro HTTP ${res.status}`)
    }
  }

  async function onDelete(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setDeletingId('')
    if (data?.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  async function copyLink(id: string) {
    const url = new URL(`/produto/${id}`, window.location.origin).toString()
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* fallback */
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 1500)
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground-strong">Produtos</h1>
          <p className="mt-1 text-sm text-muted">
            Crie um produto e compartilhe o link de checkout para receber pagamentos via PIX.
          </p>
        </div>

        <Card>
          <CardTitle step={1}>Novo produto</CardTitle>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="product-name">Nome do produto</Label>
                <Input
                  id="product-name"
                  placeholder="Consultoria, Mensalidade, Curso…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="product-amount">Valor (R$)</Label>
                <Input
                  id="product-amount"
                  inputMode="decimal"
                  placeholder="99,90"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="product-subtitle">Subtítulo (opcional)</Label>
                <Input
                  id="product-subtitle"
                  placeholder="Uma frase curta mostrada abaixo da logo no checkout"
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  maxLength={140}
                />
              </div>
              <div>
                <Label htmlFor="product-institution">Nome da instituição no QR (opcional)</Label>
                <Input
                  id="product-institution"
                  placeholder="Deixe em branco para usar o padrão da Pagar.me"
                  value={form.institutionName}
                  onChange={(e) => setForm((f) => ({ ...f, institutionName: e.target.value }))}
                  maxLength={25}
                />
              </div>
              <div>
                <Label htmlFor="product-theme">Tema do checkout</Label>
                <Select
                  id="product-theme"
                  value={form.theme}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, theme: e.target.value as ProductTheme }))
                  }
                >
                  <option value="dark">Escuro</option>
                  <option value="light">Claro</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="product-image">URL da imagem do produto (opcional)</Label>
                <Input
                  id="product-image"
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                />
                <ImagePreview url={form.imageUrl} />
              </div>
              <div>
                <Label htmlFor="product-logo">URL da logo (opcional)</Label>
                <Input
                  id="product-logo"
                  type="url"
                  placeholder="Deixe em branco para usar a logo global"
                  value={form.logoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                />
                <ImagePreview url={form.logoUrl} />
              </div>
              <div>
                <Label htmlFor="product-page-title">Título da aba do navegador (opcional)</Label>
                <Input
                  id="product-page-title"
                  placeholder="Deixe em branco para usar o nome do produto"
                  value={form.pageTitle}
                  onChange={(e) => setForm((f) => ({ ...f, pageTitle: e.target.value }))}
                  maxLength={70}
                />
              </div>
              <div>
                <Label htmlFor="product-favicon">URL do favicon (opcional)</Label>
                <Input
                  id="product-favicon"
                  type="url"
                  placeholder="https://exemplo.com/favicon.png"
                  value={form.faviconUrl}
                  onChange={(e) => setForm((f) => ({ ...f, faviconUrl: e.target.value }))}
                />
                <ImagePreview url={form.faviconUrl} className="h-6 w-6" />
              </div>
            </div>
            {createError && (
              <p className="animate-fade-in text-sm text-rose-400">{createError}</p>
            )}
            <Button type="submit" disabled={creating}>
              {creating && <Spinner />}
              {creating ? 'Criando…' : 'Criar produto'}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle step={2}>Seus produtos</CardTitle>
          {listError && <p className="animate-fade-in text-sm text-rose-400">{listError}</p>}
          {loading && !listError && (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          )}
          {!loading && !listError && products.length === 0 && (
            <p className="text-sm text-muted-2">Nenhum produto criado ainda.</p>
          )}
          {products.length > 0 && (
            <ul className="animate-fade-in space-y-2">
              {products.map((p) => {
                const link = `/produto/${p.id}`
                const isEditing = editingId === p.id
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-surface-muted/60 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {p.image_url && (
                        <SafeImage
                          src={p.image_url}
                          className="h-12 w-12 shrink-0 rounded-md object-cover ring-1 ring-border-strong"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground-strong">{p.name}</p>
                        <p className="text-xs text-muted-2">{formatBRL(p.amount)}</p>
                        {!isEditing && (
                          <p className="mt-1 text-xs text-muted-2">
                            Instituição: {p.institution_name || 'padrão'} · Tema:{' '}
                            {p.theme === 'light' ? 'claro' : 'escuro'}
                          </p>
                        )}
                        {isEditing && (
                          <div className="mt-2 max-w-sm space-y-2">
                            <div>
                              <Label htmlFor={`edit-subtitle-${p.id}`}>Subtítulo</Label>
                              <Input
                                id={`edit-subtitle-${p.id}`}
                                autoFocus
                                placeholder="Frase curta abaixo da logo"
                                value={editForm.subtitle}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, subtitle: e.target.value }))
                                }
                                maxLength={140}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-institution-${p.id}`}>Instituição no QR</Label>
                              <Input
                                id={`edit-institution-${p.id}`}
                                placeholder="Deixe em branco para usar o padrão da Pagar.me"
                                value={editForm.institutionName}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, institutionName: e.target.value }))
                                }
                                maxLength={25}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-theme-${p.id}`}>Tema do checkout</Label>
                              <Select
                                id={`edit-theme-${p.id}`}
                                value={editForm.theme}
                                onChange={(e) =>
                                  setEditForm((f) => ({
                                    ...f,
                                    theme: e.target.value as ProductTheme,
                                  }))
                                }
                              >
                                <option value="dark">Escuro</option>
                                <option value="light">Claro</option>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`edit-image-${p.id}`}>URL da imagem do produto</Label>
                              <Input
                                id={`edit-image-${p.id}`}
                                type="url"
                                placeholder="https://exemplo.com/imagem.jpg"
                                value={editForm.imageUrl}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, imageUrl: e.target.value }))
                                }
                              />
                              <ImagePreview url={editForm.imageUrl} />
                            </div>
                            <div>
                              <Label htmlFor={`edit-logo-${p.id}`}>URL da logo</Label>
                              <Input
                                id={`edit-logo-${p.id}`}
                                type="url"
                                placeholder="Deixe em branco para usar a logo global"
                                value={editForm.logoUrl}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, logoUrl: e.target.value }))
                                }
                              />
                              <ImagePreview url={editForm.logoUrl} />
                            </div>
                            <div>
                              <Label htmlFor={`edit-page-title-${p.id}`}>
                                Título da aba do navegador
                              </Label>
                              <Input
                                id={`edit-page-title-${p.id}`}
                                placeholder="Deixe em branco para usar o nome do produto"
                                value={editForm.pageTitle}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, pageTitle: e.target.value }))
                                }
                                maxLength={70}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-favicon-${p.id}`}>URL do favicon</Label>
                              <Input
                                id={`edit-favicon-${p.id}`}
                                type="url"
                                placeholder="https://exemplo.com/favicon.png"
                                value={editForm.faviconUrl}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, faviconUrl: e.target.value }))
                                }
                              />
                              <ImagePreview url={editForm.faviconUrl} className="h-6 w-6" />
                            </div>
                            {editError && <p className="text-xs text-rose-400">{editError}</p>}
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                disabled={savingEdit}
                                onClick={() => saveEdit(p.id)}
                              >
                                {savingEdit && <Spinner />}
                                {savingEdit ? 'Salvando…' : 'Salvar'}
                              </Button>
                              <Button type="button" variant="ghost" onClick={cancelEdit}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener"
                          className="text-sm text-sky-400 hover:underline"
                        >
                          abrir
                        </a>
                        <Button type="button" variant="ghost" onClick={() => copyLink(p.id)}>
                          {copiedId === p.id ? '✓ Copiado' : '🔗 Copiar link'}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => startEdit(p)}>
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={deletingId === p.id}
                          onClick={() => onDelete(p.id)}
                          className="text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10"
                        >
                          {deletingId === p.id ? <Spinner /> : 'Excluir'}
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </main>
    </>
  )
}
