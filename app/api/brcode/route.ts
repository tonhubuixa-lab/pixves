// app/api/brcode/route.ts
import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { requireSession } from '@/lib/auth'
import { buildBRCode, formatChavePix, rewriteBRCode, type TipoChavePix } from '@/lib/brcode'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))

    // Modo 1: reescrever BR Code existente
    if (body?.mode === 'rewrite') {
      if (!body?.code) {
        return NextResponse.json(
          { ok: false, error: 'Informe o BR Code original' },
          { status: 400 }
        )
      }
      const code = rewriteBRCode(body.code, {
        nome: body.nome,
        cidade: body.cidade,
      })
      const qr_code_image = await QRCode.toDataURL(code, { margin: 1, scale: 6 })
      return NextResponse.json({ ok: true, code, qr_code_image })
    }

    // Modo 2: gerar do zero
    const chave = body?.tipoChave
      ? formatChavePix(body.tipoChave as TipoChavePix, body?.chave)
      : body?.chave

    const code = buildBRCode({
      chave,
      nome: body?.nome,
      cidade: body?.cidade,
      valor: body?.valor,
      txid: body?.txid,
      descricao: body?.descricao,
    })
    const qr_code_image = await QRCode.toDataURL(code, { margin: 1, scale: 6 })
    return NextResponse.json({ ok: true, code, qr_code_image })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 400 }
    )
  }
}
