
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import StatsCards from '@/components/dashboard/StatsCards'
import RevenueChart from '@/components/dashboard/RevenueChart'
import CompanyFilter from '@/components/dashboard/CompanyFilter'
import TasksList from '@/components/dashboard/TasksList'
import UrssafSummary from '@/components/dashboard/UrssafSummary'
import ProductStats from '@/components/dashboard/ProductStats'
import RawMaterialsStock from '@/components/dashboard/RawMaterialsStock'

export default async function DashboardPage() {

  const supabase = await createClient()
  // Liste des sociétés autorisées (RLS limite automatiquement)
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
  const client = isAdmin ? await createServiceRoleClient() : supabase
  console.log('🔐 Dashboard - User:', user?.email, '| isAdmin:', isAdmin, '| Using service role:', isAdmin)
  const { data: companies } = await client.from('companies').select('id, name').order('name')
  const cookieStore = await cookies()
  let cookieCompany = cookieStore.get('activeCompanyId')?.value || null
  
  let companyId: string | null = null
  if (cookieCompany && cookieCompany !== 'all') {
    const found = companies?.find(c => c.id === cookieCompany)
    companyId = found ? found.id : null
  } else if (cookieCompany === 'all') {
    companyId = null
  } else {
    // Pas de cookie: si 1 société, on filtre; si >1, on affiche tout
    if (companies && companies.length === 1) companyId = companies[0].id
    else companyId = null
  }
  // Si aucune société accessible
  // isAdmin computed above
  if (!isAdmin && (!companies || companies.length === 0)) {
    return <div className="p-8 text-red-600">Aucune société associée à votre compte.</div>
  }

  // Filtrer toutes les requêtes par company_id
  let invoicesQuery = client
    .from('invoices')
    .select('*, customer:customers(name), company:companies(name)')
    .order('date', { ascending: false })
  let purchasesQuery = client
    .from('purchases')
    .select('*, supplier:suppliers(name), company:companies(name)')
    .order('purchase_date', { ascending: false })
  if (companyId) {
    invoicesQuery = invoicesQuery.eq('company_id', companyId)
    purchasesQuery = purchasesQuery.eq('company_id', companyId)
  }
  const { data: invoices } = await invoicesQuery
  const { data: purchases } = await purchasesQuery
  console.log('📊 Dashboard - Factures chargées:', invoices?.length || 0, '| User:', user?.email)
  
  // Charger les données pour les nouveaux widgets
  const { data: rawMaterials } = await client.from('raw_materials').select('*')
  const { data: products } = await client.from('products').select('*')
  const { data: fixedCosts } = await client.from('fixed_costs').select('*')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📊 Tableau de bord</h1>
        {isAdmin && <CompanyFilter companies={companies || []} canSeeAllOverride={true} />}
      </div>

      <StatsCards companyId={companyId ?? 'all'} />
      
      <RevenueChart companyId={companyId ?? 'all'} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RawMaterialsStock materials={rawMaterials || []} />
        <UrssafSummary invoices={invoices || []} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductStats 
          products={products || []} 
          invoices={invoices || []} 
        />
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Insights
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="p-3 bg-blue-50 rounded-lg">
              💰 Vos produits les plus rentables s'affichent ci-contre
            </p>
            <p className="p-3 bg-green-50 rounded-lg">
              📊 Suivez vos tendances mensuelles pour anticiper
            </p>
            <p className="p-3 bg-purple-50 rounded-lg">
              ⚠️ Les alertes de stock vous évitent les ruptures
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
