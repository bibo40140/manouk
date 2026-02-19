import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import ProductionsHistory from '@/components/productions/ProductionsHistory'

export default async function ProductionsPage() {
  const supabase = await createClient()
  const client = createServiceRoleClient()

  // Récupérer toutes les productions avec les infos produits
  const { data: productions } = await client
    .from('productions')
    .select(`
      *,
      product:products(id, name, price)
    `)
    .order('production_date', { ascending: false })

  // Récupérer la liste des produits pour le filtre
  const { data: products } = await client
    .from('products')
    .select('id, name')
    .order('name')

  const { data: customers } = await client
    .from('customers')
    .select('id, name')
    .order('name')

  const { data: deliveryLinks } = await client
    .from('delivery_productions')
    .select('production_id, delivery:deliveries(id, delivery_date)')

  const deliveryMap = new Map<string, any>()
  ;(deliveryLinks || []).forEach((link: any) => {
    deliveryMap.set(link.production_id, link.delivery)
  })

  const productionsWithDelivery = (productions || []).map((p: any) => ({
    ...p,
    delivery: deliveryMap.get(p.id) || null
  }))

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historique des Productions</h1>
      </div>
      
      <ProductionsHistory 
        productions={productionsWithDelivery} 
        products={products || []}
        customers={customers || []}
      />
    </div>
  )
}
