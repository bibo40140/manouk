import { createClient } from '@/lib/supabase/server'
import StockInterface from '@/components/stock/StockInterface'

export default async function StockPage() {
  const supabase = await createClient()

  // Récupérer les matières premières avec leur stock
  const { data: rawMaterials } = await supabase
    .from('raw_materials')
    .select('*')
    .order('name')

  // Récupérer les produits avec leur stock
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('name')

  // Récupérer les informations de la société pour les alertes email
  const { data: { user } } = await supabase.auth.getUser()
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, email')
    .eq('user_id', user?.id)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des Stocks</h1>
      <StockInterface 
        rawMaterials={rawMaterials || []} 
        products={products || []}
        companies={companies || []}
      />
    </div>
  )
}
