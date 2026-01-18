import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ForecastInterface from '@/components/forecast/ForecastInterface'
import { cookies } from 'next/headers'


export default async function ForecastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  
  const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
  const client = isAdmin ? await createServiceRoleClient() : supabase
  
  // Récupère les sociétés (toutes pour admin, filtrées pour user normal)
  let companiesQuery = client.from('companies').select('*').order('name')
  if (!isAdmin) {
    companiesQuery = companiesQuery.eq('user_id', user.id)
  }
  
  const { data: companies } = await companiesQuery
  
  if (!companies || companies.length === 0) {
    return <div className="p-8 text-red-600">Aucune société associée à votre compte.</div>
  }
  
  // Charger les product_company_splits pour les calculs par société
  const { data: productSplits } = await client.from('product_company_splits').select('*')
  
  // Charger tous les produits (ils sont liés via product_company_splits, pas directement par company_id)
  const { data: products } = await client.from('products').select('*, product_materials(*, raw_material:raw_materials(*))').order('name')
  const { data: rawMaterials } = await client.from('raw_materials').select('*').order('name')
  const { data: fixedCosts } = await client.from('fixed_costs').select('*').order('name')

  return (
    <ForecastInterface
      products={products || []}
      rawMaterials={rawMaterials || []}
      fixedCosts={fixedCosts || []}
      companies={companies || []}
      productSplits={productSplits || []}
    />
  )
}
