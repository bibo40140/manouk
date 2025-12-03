import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ForecastSimulator from '@/components/forecast/ForecastSimulator'


export default async function ForecastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Utiliser le service role client pour charger toutes les données sans restriction RLS
  const supabaseAdmin = createServiceRoleClient()
  
  // Charger toutes les données (toutes les sociétés)
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('*, product_materials(*, raw_material:raw_materials(*))')
    .order('name')
  
  const { data: rawMaterials } = await supabaseAdmin
    .from('raw_materials')
    .select('*')
    .order('name')

  // Charger les répartitions par société pour chaque produit
  const { data: splits } = await supabaseAdmin
    .from('product_company_splits')
    .select('*, company:companies(*)')
    .order('product_id')

  // Charger toutes les sociétés
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('*')
    .order('name')

  // Charger les achats pour calculer les dépenses par société
  const { data: purchases } = await supabaseAdmin
    .from('purchases')
    .select('*, raw_material:raw_materials(*), supplier:suppliers(*)')
    .order('date', { ascending: false })

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💰 Trésorerie prévisionnelle</h1>
      
      <ForecastSimulator 
        products={products || []}
        rawMaterials={rawMaterials || []}
        splits={splits || []}
        companies={companies || []}
        purchases={purchases || []}
      />
    </div>
  )
}
