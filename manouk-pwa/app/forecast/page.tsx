import { createClient } from '@/lib/supabase/server'
import ForecastInterface from '@/components/forecast/ForecastInterface'

export default async function ForecastPage() {
  const supabase = await createClient()

  // Récupérer les produits avec leurs BOM
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      product_materials (
        quantity,
        raw_material:raw_materials (
          id,
          name,
          unit_cost,
          unit
        )
      )
    `)
    .order('name')

  // Récupérer les matières premières
  const { data: rawMaterials } = await supabase
    .from('raw_materials')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">💰 Trésorerie prévisionnelle</h1>
      <p className="text-gray-600">
        Simulez vos ventes futures pour anticiper votre trésorerie. Les coûts matières et l'URSSAF sont calculés automatiquement.
      </p>

      <ForecastInterface 
        products={products || []} 
        rawMaterials={rawMaterials || []} 
      />
    </div>
  )
}
