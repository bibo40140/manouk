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
  const cookieCompany = (await cookies()).get('activeCompanyId')?.value || null
  let companyId: string | null = null
  if (cookieCompany && cookieCompany !== 'all') {
    const found = companies?.find(c => c.id === cookieCompany)
    companyId = found ? found.id : null
  } else if (cookieCompany === 'all') {
    companyId = null
  }
  // Admin: par défaut voit tout, mais s'il a sélectionné une société via le cookie, on respecte ce filtre

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
  if (companyId) productsQuery = productsQuery.eq('company_id', companyId)
  const { data: products } = await productsQuery

  // Récupérer les matières premières
  let rawMaterialsQuery = client
    .from('raw_materials')
    .select('*')
    .order('name')
  if (companyId) rawMaterialsQuery = rawMaterialsQuery.eq('company_id', companyId)
  const { data: rawMaterials } = await rawMaterialsQuery

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
      />
    </div>
  )
}
