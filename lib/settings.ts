// lib/settings.ts
import { createValueStore } from './kv'

export interface SplitRecipient {
  id: string
  label: string
  recipient_id: string
  percentage: number
}

export interface SettingsRecord {
  logo_url: string | null
  split_recipients: SplitRecipient[]
}

const store = createValueStore<SettingsRecord>('pix:settings', 'settings.json', {
  logo_url: null,
  split_recipients: [],
})

export async function getSettings(): Promise<SettingsRecord> {
  return store.get()
}

export async function updateSettings(patch: Partial<SettingsRecord>): Promise<SettingsRecord> {
  return store.update(patch)
}
