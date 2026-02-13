import { createClient } from '@/lib/supabase/server'
import ProductionsHistory from '@/components/productions/ProductionsHistory'

export default async function ProductionsPage() {
  const supabase = await createClient()

  // Récupérer toutes les productions avec les infos produits
  const { data: productions } = await supabase
    .from('productions')
    .select(`
      *,
      product:products(id, name, price)
    `)
    .order('production_date', { ascending: false })

  // Récupérer la liste des produits pour le filtre
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .order('name')

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historique des Productions</h1>
      </div>
      
      <ProductionsHistory 
        productions={productions || []} 
        products={products || []}
      />
    </div>
  )
}
