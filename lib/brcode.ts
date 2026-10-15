// lib/brcode.ts
// BR Code (PIX Copia e Cola) — padrão EMV® QRCPS-MPM do BACEN.
// Toda alteração em nome/cidade exige recálculo do CRC16 (tag 63).

export function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function tlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0')
  return `${tag}${len}${value}`
}

export function sanitize(str: string | undefined, max: number): string {
  return String(str ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .slice(0, max)
}

export type TipoChavePix = 'cpf' | 'telefone' | 'email' | 'aleatoria'

/**
 * Normaliza e valida uma chave PIX de acordo com o tipo selecionado,
 * retornando o valor no formato exigido pelo BR Code (tag 01).
 */
export function formatChavePix(tipo: TipoChavePix, valorRaw: string): string {
  const valor = String(valorRaw ?? '').trim()
  if (!valor) throw new Error('Informe o valor da chave PIX')

  switch (tipo) {
    case 'cpf': {
      const digits = valor.replace(/\D/g, '')
      if (digits.length !== 11) throw new Error('CPF inválido: deve conter 11 dígitos')
      return digits
    }
    case 'telefone': {
      let digits = valor.replace(/\D/g, '')
      if (digits.length === 10 || digits.length === 11) digits = '55' + digits
      if (digits.length !== 12 && digits.length !== 13) {
        throw new Error('Telefone inválido. Use DDD + número, ex: (11) 99999-8888')
      }
      return '+' + digits
    }
    case 'email': {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
        throw new Error('E-mail inválido')
      }
      return valor.toLowerCase()
    }
    case 'aleatoria': {
      const uuid = valor.toLowerCase()
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)) {
        throw new Error('Chave aleatória inválida. Formato esperado: UUID (ex: 123e4567-e89b-12d3-a456-426614174000)')
      }
      return uuid
    }
    default:
      throw new Error('Tipo de chave PIX inválido')
  }
}

export interface BuildBRCodeInput {
  chave: string
  nome?: string
  cidade?: string
  valor?: number | string
  txid?: string
  descricao?: string
}

export function buildBRCode({
  chave,
  nome,
  cidade,
  valor,
  txid,
  descricao,
}: BuildBRCodeInput): string {
  if (!chave) throw new Error('Chave PIX obrigatória')

  const gui = tlv('00', 'br.gov.bcb.pix')
  const key = tlv('01', chave)
  const desc = descricao ? tlv('02', sanitize(descricao, 40)) : ''
  const merchantAccount = tlv('26', gui + key + desc)

  let payload = ''
  payload += tlv('00', '01')
  payload += tlv('01', '12')
  payload += merchantAccount
  payload += tlv('52', '0000')
  payload += tlv('53', '986')
  if (valor && Number(valor) > 0) {
    payload += tlv('54', Number(valor).toFixed(2))
  }
  payload += tlv('58', 'BR')
  payload += tlv('59', sanitize(nome, 25) || 'RECEBEDOR')
  payload += tlv('60', sanitize(cidade, 15) || 'SAO PAULO')
  payload += tlv('62', tlv('05', (txid || '***').slice(0, 25)))
  payload += '6304'
  payload += crc16(payload)
  return payload
}

/**
 * Localiza uma tag no nível raiz do BR Code (fora dos TLVs aninhados,
 * como o 26 e o 62) andando pelo payload pelos tamanhos declarados —
 * nunca por regex no conteúdo, já que o valor de uma tag (ex: nome
 * contendo um CPF mascarado) pode conter dígitos que colidem com
 * outras tags.
 */
function findRootTag(body: string, tag: string): { start: number; len: number } | null {
  let i = 0
  while (i + 4 <= body.length) {
    const currentTag = body.slice(i, i + 2)
    const lenStr = body.slice(i + 2, i + 4)
    const len = Number(lenStr)
    if (!/^\d{2}$/.test(lenStr) || i + 4 + len > body.length) break
    if (currentTag === tag) return { start: i, len }
    i += 4 + len
  }
  return null
}

function replaceRootTag(body: string, tag: string, value: string): string {
  const found = findRootTag(body, tag)
  if (!found) {
    throw new Error(`Tag ${tag} não encontrada no BR Code`)
  }
  const { start, len } = found
  const before = body.slice(0, start)
  const after = body.slice(start + 4 + len)
  return before + tlv(tag, value) + after
}

/**
 * Reescreve nome (59) e cidade (60) de um BR Code já existente,
 * recalculando o CRC16. Útil para "ofuscar" o recebedor.
 */
export function rewriteBRCode(
  code: string,
  { nome, cidade }: { nome?: string; cidade?: string }
): string {
  if (!code || typeof code !== 'string') {
    throw new Error('Código BR Code inválido')
  }

  // Remove CRC (últimos 4) e o header "6304"
  const withoutCrc = code.slice(0, -4)
  if (!withoutCrc.endsWith('6304')) {
    throw new Error('BR Code malformado: falta tag 6304')
  }
  const body = withoutCrc.slice(0, -4)

  let out = body

  if (nome !== undefined) {
    out = replaceRootTag(out, '59', sanitize(nome, 25) || 'RECEBEDOR')
  }

  if (cidade !== undefined) {
    out = replaceRootTag(out, '60', sanitize(cidade, 15) || 'SAO PAULO')
  }

  return out + '6304' + crc16(out + '6304')
}

/**
 * Extrai os campos principais de um BR Code (para exibir/editar).
 */
export function parseBRCode(code: string) {
  const get = (tag: string) => {
    const re = new RegExp(`${tag}(\\d{2})([\\s\\S]{0,999}?)`)
    const m = code.match(re)
    if (!m) return null
    const len = Number(m[1])
    // pega exatamente `len` caracteres após os 2 dígitos de tamanho
    const start = m.index! + tag.length + 2
    return code.slice(start, start + len)
  }

  return {
    chave: (() => {
      const m = code.match(/26\d{2}0014br\.gov\.bcb\.pix01(\d{2})([^0-9]+)/)
      if (!m) return null
      const len = Number(m[1])
      return m[2].slice(0, len)
    })(),
    nome: get('59'),
    cidade: get('60'),
    valor: get('54'),
    txid: get('62')?.replace(/^05\d{2}/, '') ?? null,
  }
}
