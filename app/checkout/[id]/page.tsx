import { notFound } from 'next/navigation'
import { getCharge } from '@/lib/store'
import { CheckoutView } from '@/components/CheckoutView'

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!(await getCharge(id))) notFound()

  return <CheckoutView id={id} />
}
