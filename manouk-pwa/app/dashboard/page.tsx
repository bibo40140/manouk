
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import StatsCards from '@/components/dashboard/StatsCards'
import RevenueChart from '@/components/dashboard/RevenueChart'
import RecentInvoices from '@/components/dashboard/RecentInvoices'
import RecentPurchases from '@/components/dashboard/RecentPurchases'
import CompanyFilter from '@/components/dashboard/CompanyFilter'

export default async function DashboardPage() {

  const supabase = await createClient()
  // Liste des sociétés autorisées (RLS limite automatiquement)
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
  const client = isAdmin ? await createServiceRoleClient() : supabase
  const { data: companies } = await client.from('companies').select('id, name').order('name')
  const cookieCompany = (await cookies()).get('activeCompanyId')?.value || null
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
    .order('invoice_date', { ascending: false })
    .limit(5)
  let purchasesQuery = client
    .from('purchases')
    .select('*, supplier:suppliers(name), company:companies(name)')
    .order('purchase_date', { ascending: false })
    .limit(5)
  if (companyId) {
    invoicesQuery = invoicesQuery.eq('company_id', companyId)
    purchasesQuery = purchasesQuery.eq('company_id', companyId)
  }
  const { data: invoices } = await invoicesQuery
  const { data: purchases } = await purchasesQuery

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📊 Tableau de bord</h1>
        <CompanyFilter companies={companies || []} canSeeAllOverride={true} />
      </div>

      <StatsCards companyId={companyId ?? 'all'} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <RevenueChart companyId={companyId ?? 'all'} />
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            💰 Rentabilité par produit (Top 10)
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Graphique à venir
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <RecentInvoices invoices={invoices || []} />
        <RecentPurchases purchases={purchases || []} />
      </div>
    </div>
  )
}
