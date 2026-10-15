import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProduct } from '@/lib/products'
import { ProductCheckoutView } from '@/components/ProductCheckoutView'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return {}

  return {
    title: product.page_title || product.name,
    icons: product.favicon_url ? { icon: product.favicon_url } : undefined,
  }
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  return <ProductCheckoutView product={product} />
}
