// app/api/settings/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { getSettings, updateSettings, type SplitRecipient } from '@/lib/settings'

export const runtime = 'nodejs'

// Pública: o checkout (produto ou cobrança avulsa) precisa ler a logo sem login.
// split_recipients só é incluído para quem está autenticado (painel admin) —
// não deve ficar exposto na página pública de checkout.
export async function GET() {
  try {
    const settings = await getSettings()
    let authenticated = true
    try {
      await requireSession()
    } catch {
      authenticated = false
    }

    if (!authenticated) {
      return NextResponse.json({ ok: true, logo_url: settings.logo_url })
    }
    return NextResponse.json({ ok: true, ...settings })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const patch: Partial<{ logo_url: string | null; split_recipients: SplitRecipient[] }> = {}

    if (body?.logo_url !== undefined) {
      const logoUrl = String(body.logo_url || '').trim()
      patch.logo_url = logoUrl || null
    }

    if (body?.split_recipients !== undefined) {
      const list = Array.isArray(body.split_recipients) ? body.split_recipients : []
      const recipients: SplitRecipient[] = []
      for (const item of list) {
        const recipientId = String(item?.recipient_id || '').trim()
        const percentage = Number(item?.percentage)
        if (!recipientId || !Number.isFinite(percentage) || percentage <= 0) {
          return NextResponse.json(
            { ok: false, error: 'Cada colaborador precisa de um ID de recebedor e uma porcentagem válida (maior que 0)' },
            { status: 400 }
          )
        }
        recipients.push({
          id: String(item?.id || crypto.randomUUID()),
          label: String(item?.label || '').trim(),
          recipient_id: recipientId,
          percentage,
        })
      }
      patch.split_recipients = recipients
    }

    const settings = await updateSettings(patch)
    return NextResponse.json({ ok: true, ...settings })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
