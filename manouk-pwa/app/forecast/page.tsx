import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import ForecastInterface from '@/components/forecast/ForecastInterface'
import CompanyFilter from '@/components/dashboard/CompanyFilter'
import { cookies } from 'next/headers'

export default async function ForecastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
  const client = isAdmin ? await createServiceRoleClient() : supabase

  // Récupérer les produits avec leurs BOM
  const { data: companies } = await client.from('companies').select('id, name').order('name')
  
  // Charger les product_company_splits pour les calculs par société
  const { data: productSplits, error: splitsError } = await client.from('product_company_splits').select('*')
  
  // Cette page doit être identique pour tous les tenants: on voit tout
  let productsQuery = client
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
  const { data: products } = await productsQuery

  // Récupérer les matières premières
  let rawMaterialsQuery = client
    .from('raw_materials')
    .select('*')
    .order('name')
  const { data: rawMaterials } = await rawMaterialsQuery
  
  // Récupérer les frais fixes
  const { data: fixedCosts } = await client.from('fixed_costs').select('*')
  
  console.log('🗄️ [forecast/page] Loaded data:', {
    productsCount: products?.length,
    productSplitsCount: productSplits?.length,
    productSplitsData: productSplits,
    splitsError
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">💰 Trésorerie prévisionnelle</h1>
        <CompanyFilter companies={companies || []} canSeeAllOverride={isAdmin || (companies ? companies.length > 1 : false)} />
      </div>
      <p className="text-gray-600">
        Simulez vos ventes futures pour anticiper votre trésorerie. Les coûts matières et l'URSSAF sont calculés automatiquement.
      </p>

      <ForecastInterface 
        products={products || []} 
        rawMaterials={rawMaterials || []} 
        productSplits={productSplits || []} 
        companies={companies || []}
        fixedCosts={fixedCosts || []}
      />
    </div>
  )
}
