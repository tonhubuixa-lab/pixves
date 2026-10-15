// app/api/products/[id]/pix/route.ts
import { NextResponse } from 'next/server'
import { PagarmeError } from '@/lib/pagarme'
import { createPixCharge } from '@/lib/pixCharge'
import { getProduct } from '@/lib/products'

export const runtime = 'nodejs'

// Pública: o comprador acessa o link do produto sem login e gera o próprio PIX.
// O valor e a descrição vêm sempre do produto salvo — o comprador não os controla.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const product = await getProduct(id)
    if (!product) {
      return NextResponse.json({ ok: false, error: 'Produto não encontrado' }, { status: 404 })
    }

    if (!process.env.PAGARME_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'PAGARME_API_KEY não configurado' },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const customer = body?.customer ?? {}
    const name = String(customer.name || '').trim()
    const email = String(customer.email || '').trim()
    const document = String(customer.document || '').trim()

    if (!name || !email || !document) {
      return NextResponse.json(
        { ok: false, error: 'Preencha nome, e-mail e CPF/CNPJ' },
        { status: 400 }
      )
    }

    const quantity = Math.round(Number(body?.quantity))
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json(
        { ok: false, error: 'Quantidade inválida' },
        { status: 400 }
      )
    }

    const description =
      quantity > 1 ? `${product.name} (${quantity}x)` : product.name

    const result = await createPixCharge({
      amount: product.amount * quantity,
      description,
      institutionName: product.institution_name,
      customer: { name, email, document, phone: customer.phone },
      productId: product.id,
    })

    return NextResponse.json({ ok: true, ...result, qr_code_image: result.qr_code_url })
  } catch (err) {
    if (err instanceof PagarmeError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Erro ao gerar PIX',
          http_status: err.status,
          pagarme_response: err.response,
        },
        { status: err.status }
      )
    }
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
