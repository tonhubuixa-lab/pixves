import type { Metadata } from 'next'
import { getFirstProduct } from '@/lib/products'
import { ProductCheckoutView } from '@/components/ProductCheckoutView'

export async function generateMetadata(): Promise<Metadata> {
  const product = await getFirstProduct()
  if (!product) return {}

  return {
    title: product.page_title || product.name,
    icons: product.favicon_url ? { icon: product.favicon_url } : undefined,
  }
}

export default async function HomePage() {
  const product = await getFirstProduct()

  if (!product) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-slate-100">Nenhum produto disponível</p>
        <p className="mt-1 text-sm text-slate-400">Configure um produto no painel administrativo.</p>
      </main>
    )
  }

  return <ProductCheckoutView product={product} />
}
