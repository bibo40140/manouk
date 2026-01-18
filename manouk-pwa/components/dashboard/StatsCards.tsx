import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export default async function StatsCards({ companyId }: { companyId?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
  const client = isAdmin ? await createServiceRoleClient() : supabase

  // Construire les queries avec filtre optionnel
  let invoicesQuery = client.from('invoices').select('total, paid, urssaf_amount, urssaf_paid_amount, urssaf_paid_date')
  let purchasesQuery = client.from('purchases').select('quantity, unit_cost, paid')
  let fixedCostsQuery = client.from('fixed_costs').select('amount, frequency, company_id')

  if (companyId && companyId !== 'all') {
    invoicesQuery = invoicesQuery.eq('company_id', companyId)
    purchasesQuery = purchasesQuery.eq('company_id', companyId)
    fixedCostsQuery = fixedCostsQuery.eq('company_id', companyId)
  }

  // Récupérer les statistiques
  const { data: invoices } = await invoicesQuery
  const { data: purchases } = await purchasesQuery
  const { data: fixedCosts } = await fixedCostsQuery

  // Fonction pour convertir en montant mensuel
  const getMonthlyAmount = (amount: number, frequency: string) => {
    switch(frequency) {
      case 'yearly': return amount / 12
      case 'quarterly': return amount / 3
      default: return amount
    }
  }

  // Calculer le total des frais fixes mensuels
  const fixedCostsMonthly = fixedCosts?.reduce((sum, cost) => 
    sum + getMonthlyAmount(Number(cost.amount), cost.frequency), 0) || 0

  // Calculs
  const totalPaid = invoices?.reduce((sum, inv) => sum + Number(inv.paid), 0) || 0
  const receivables = invoices?.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paid)), 0) || 0
  
  const purchasesPaid = purchases?.filter(p => p.paid).reduce((sum, p) => sum + (Number(p.quantity) * Number(p.unit_cost)), 0) || 0
  const payables = purchases?.filter(p => !p.paid).reduce((sum, p) => sum + (Number(p.quantity) * Number(p.unit_cost)), 0) || 0
  
  // URSSAF payé = somme des montants payés uniquement si une date de paiement existe
  const urssafPaid = invoices?.reduce((sum, inv) => sum + (inv.urssaf_paid_date ? Number(inv.urssaf_paid_amount) || 0 : 0), 0) || 0;
  // URSSAF dû = somme des montants URSSAF des factures non payées (pas de date de paiement)
  const urssafDue = invoices?.reduce((sum, inv) => sum + (!inv.urssaf_paid_date ? Number(inv.urssaf_amount) || 0 : 0), 0) || 0;
  
  const result = totalPaid - purchasesPaid - urssafPaid - fixedCostsMonthly

  const stats = [
    { label: 'CA', value: totalPaid, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-600' },
    { label: 'Créances', value: receivables, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-600' },
    { label: 'Achats', value: purchasesPaid, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-600' },
    { label: 'Dettes', value: payables, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-600' },
    { label: 'URSSAF dû', value: urssafDue, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-600' },
    { label: 'URSSAF payé', value: urssafPaid, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-600' },
    { label: 'Frais fixes/mois', value: fixedCostsMonthly, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-600' },
    { label: 'Résultat', value: result, color: result >= 0 ? 'text-green-600' : 'text-red-600', bg: result >= 0 ? 'bg-green-50' : 'bg-red-50', border: result >= 0 ? 'border-green-600' : 'border-red-600' },
  ]

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bg} ${stat.border} border-l-4 rounded-lg p-4 hover:shadow-lg transition-all`}
        >
          <div className="text-sm font-medium text-gray-600">{stat.label}</div>
          <div className={`text-2xl font-bold ${stat.color} mt-1`}>
            {formatEuro(stat.value)}
          </div>
        </div>
      ))}
    </div>
  )
}
