// app/api/products/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { listProducts, saveProduct, type ProductTheme } from '@/lib/products'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const products = await listProducts()
    return NextResponse.json({ ok: true, products })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const name = String(body?.name || '').trim()
    const amount = Number(body?.amount)
    const institutionName = String(body?.institution_name || '').trim()
    const imageUrl = String(body?.image_url || '').trim()
    const logoUrl = String(body?.logo_url || '').trim()
    const subtitle = String(body?.subtitle || '').trim()
    const pageTitle = String(body?.page_title || '').trim()
    const faviconUrl = String(body?.favicon_url || '').trim()
    const theme: ProductTheme = body?.theme === 'light' ? 'light' : 'dark'

    if (!name) {
      return NextResponse.json({ ok: false, error: 'Nome é obrigatório' }, { status: 400 })
    }
    if (!amount || amount < 100) {
      return NextResponse.json(
        { ok: false, error: 'Valor mínimo: R$ 1,00' },
        { status: 400 }
      )
    }

    const product = {
      id: crypto.randomUUID(),
      name,
      amount,
      institution_name: institutionName || null,
      image_url: imageUrl || null,
      logo_url: logoUrl || null,
      subtitle: subtitle || null,
      page_title: pageTitle || null,
      favicon_url: faviconUrl || null,
      theme,
      created_at: new Date().toISOString(),
    }
    await saveProduct(product)

    return NextResponse.json({ ok: true, product })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
