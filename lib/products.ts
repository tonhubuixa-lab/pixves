// lib/products.ts
import { createListStore } from './kv'

export type ProductTheme = 'dark' | 'light'

export interface ProductRecord {
  id: string
  name: string
  amount: number // em centavos
  institution_name: string | null
  image_url: string | null
  logo_url: string | null
  subtitle: string | null
  page_title: string | null
  favicon_url: string | null
  theme: ProductTheme
  created_at: string
}

const store = createListStore<ProductRecord>('pix:products', 'products.json')

export async function saveProduct(record: ProductRecord) {
  return store.save(record)
}

export async function getProduct(id: string): Promise<ProductRecord | undefined> {
  return store.get(id)
}

export async function updateProduct(
  id: string,
  patch: Partial<
    Pick<
      ProductRecord,
      | 'name'
      | 'amount'
      | 'institution_name'
      | 'image_url'
      | 'logo_url'
      | 'subtitle'
      | 'page_title'
      | 'favicon_url'
      | 'theme'
    >
  >
): Promise<ProductRecord | undefined> {
  return store.update(id, patch)
}

export async function removeProduct(id: string): Promise<boolean> {
  return store.remove(id)
}

export async function listProducts(): Promise<ProductRecord[]> {
  return store.list()
}

/** O produto mais antigo (primeiro criado) — usado como vitrine na home pública. */
export async function getFirstProduct(): Promise<ProductRecord | undefined> {
  const all = await store.list()
  return all.reduce<ProductRecord | undefined>((oldest, p) => {
    if (!oldest) return p
    return new Date(p.created_at) < new Date(oldest.created_at) ? p : oldest
  }, undefined)
}
