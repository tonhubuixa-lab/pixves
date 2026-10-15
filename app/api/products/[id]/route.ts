// app/api/products/[id]/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { getProduct, removeProduct, updateProduct } from '@/lib/products'

export const runtime = 'nodejs'

// Pública: a página de checkout do produto precisa ler nome/valor sem login.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const product = await getProduct(id)
    if (!product) {
      return NextResponse.json({ ok: false, error: 'Produto não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, product })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await req.json().catch(() => ({}))
    const patch: Partial<{
      name: string
      amount: number
      institution_name: string | null
      image_url: string | null
      logo_url: string | null
      subtitle: string | null
      page_title: string | null
      favicon_url: string | null
      theme: 'dark' | 'light'
    }> = {}

    if (body?.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) {
        return NextResponse.json({ ok: false, error: 'Nome é obrigatório' }, { status: 400 })
      }
      patch.name = name
    }

    if (body?.amount !== undefined) {
      const amount = Number(body.amount)
      if (!amount || amount < 100) {
        return NextResponse.json(
          { ok: false, error: 'Valor mínimo: R$ 1,00' },
          { status: 400 }
        )
      }
      patch.amount = amount
    }

    if (body?.institution_name !== undefined) {
      const institutionName = String(body.institution_name || '').trim()
      patch.institution_name = institutionName || null
    }

    if (body?.image_url !== undefined) {
      const imageUrl = String(body.image_url || '').trim()
      patch.image_url = imageUrl || null
    }

    if (body?.logo_url !== undefined) {
      const logoUrl = String(body.logo_url || '').trim()
      patch.logo_url = logoUrl || null
    }

    if (body?.subtitle !== undefined) {
      const subtitle = String(body.subtitle || '').trim()
      patch.subtitle = subtitle || null
    }

    if (body?.page_title !== undefined) {
      const pageTitle = String(body.page_title || '').trim()
      patch.page_title = pageTitle || null
    }

    if (body?.favicon_url !== undefined) {
      const faviconUrl = String(body.favicon_url || '').trim()
      patch.favicon_url = faviconUrl || null
    }

    if (body?.theme !== undefined) {
      patch.theme = body.theme === 'light' ? 'light' : 'dark'
    }

    const product = await updateProduct(id, patch)
    if (!product) {
      return NextResponse.json({ ok: false, error: 'Produto não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, product })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  try {
    const removed = await removeProduct(id)
    if (!removed) {
      return NextResponse.json({ ok: false, error: 'Produto não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
