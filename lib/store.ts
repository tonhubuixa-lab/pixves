// lib/store.ts
import { createListStore } from './kv'

export interface ChargeRecord {
  id: string
  order_id: string | null
  amount: number | null
  status: string | null
  payment_method?: 'pix' | 'credit_card'
  qr_code: string | null
  qr_code_url: string | null
  expires_at: string | null
  card_brand?: string | null
  card_last_four?: string | null
  description: string | null
  institution_name: string | null
  payer_name: string | null
  payer_email: string | null
  payer_document: string | null
  product_id: string | null
  created_at: string
}

const store = createListStore<ChargeRecord>('pix:charges', 'charges.json')

export async function saveCharge(record: ChargeRecord) {
  return store.save(record)
}

export async function getCharge(id: string): Promise<ChargeRecord | undefined> {
  return store.get(id)
}

export async function updateCharge(id: string, patch: Partial<ChargeRecord>) {
  return store.update(id, patch)
}

export async function listCharges(): Promise<ChargeRecord[]> {
  return store.list()
}
