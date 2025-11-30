import { createClient } from '@/lib/supabase/server'
import StatsCards from '@/components/dashboard/StatsCards'
import RevenueChart from '@/components/dashboard/RevenueChart'
import RecentInvoices from '@/components/dashboard/RecentInvoices'
import RecentPurchases from '@/components/dashboard/RecentPurchases'
import CompanyFilter from '@/components/dashboard/CompanyFilter'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('name')

  // Lire la société active depuis le cookie (set côté client par le hook)
  let companyId = 'all'
  let cookieStore
  try {
    cookieStore = await cookies()
  } catch (e) {}
  if (cookieStore) {
    companyId = cookieStore.get('active_company_id')?.value || companies?.[0]?.id || 'all'
  } else {
    companyId = companies?.[0]?.id || 'all'
  }

  // Construire la query de base
  let invoicesQuery = supabase
    .from('invoices')
    .select('*, customer:customers(name), company:companies(name)')
    .order('invoice_date', { ascending: false })

  let purchasesQuery = supabase
    .from('purchases')
    .select('*, supplier:suppliers(name), company:companies(name)')
    .order('purchase_date', { ascending: false })

  // Filtrer par société si nécessaire
  if (companyId && companyId !== 'all') {
    invoicesQuery = invoicesQuery.eq('company_id', companyId)
    purchasesQuery = purchasesQuery.eq('company_id', companyId)
  }

  const [
    { data: invoices },
    { data: purchases }
  ] = await Promise.all([
    invoicesQuery.limit(5),
    purchasesQuery.limit(5)
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📊 Tableau de bord</h1>
        <CompanyFilter companies={companies || []} />
      </div>

      <StatsCards companyId={companyId} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart companyId={companyId} />
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💰 Rentabilité par produit (Top 10)
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Graphique à venir
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentInvoices invoices={invoices || []} />
        <RecentPurchases purchases={purchases || []} />
      </div>
    </div>
  )
}
