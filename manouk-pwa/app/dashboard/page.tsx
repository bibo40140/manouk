
import { createClient } from '@/lib/supabase/server'
import StatsCards from '@/components/dashboard/StatsCards'
import RevenueChart from '@/components/dashboard/RevenueChart'
import RecentInvoices from '@/components/dashboard/RecentInvoices'
import RecentPurchases from '@/components/dashboard/RecentPurchases'

export default async function DashboardPage() {

  const supabase = await createClient()
  // Récupère la société du user connecté (mono-société)
  const { data: companies } = await supabase.from('companies').select('*').order('name')
  const company = companies?.[0]
  if (!company) {
    return <div className="p-8 text-red-600">Aucune société associée à votre compte.</div>
  }
  const companyId = company.id

  // Filtrer toutes les requêtes par company_id
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, customer:customers(name), company:companies(name)')
    .eq('company_id', companyId)
    .order('invoice_date', { ascending: false })
    .limit(5)
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, supplier:suppliers(name), company:companies(name)')
    .eq('company_id', companyId)
    .order('purchase_date', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📊 Tableau de bord</h1>
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
