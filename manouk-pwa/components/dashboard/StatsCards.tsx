'use client'

import { useState, useMemo } from 'react'

type Invoice = {
  total: number
  paid: number
  urssaf_amount: number | null
  urssaf_paid_amount: number | null
  urssaf_paid_date: string | null
  date: string
}

type Purchase = {
  quantity: number
  unit_cost: number
  paid: boolean
  purchase_date: string
}

type FixedCost = {
  amount: number
  frequency: string
  company_id: string
}

export default function StatsCards({ 
  companyId, 
  isAdmin,
  invoices: allInvoices,
  purchases: allPurchases,
  fixedCosts
}: { 
  companyId?: string
  isAdmin: boolean
  invoices: Invoice[]
  purchases: Purchase[]
  fixedCosts: FixedCost[]
}) {
  const currentYear = new Date().getFullYear().toString()
  const [selectedYear, setSelectedYear] = useState<string>(currentYear)

  // Extraire les années disponibles
  const years = useMemo(() => {
    const invoiceYears = allInvoices?.map(inv => new Date(inv.date).getFullYear()) || []
    const uniqueYears = [...new Set(invoiceYears)].sort((a, b) => b - a)
    return uniqueYears
  }, [allInvoices])
  // Filtrer les données selon l'année sélectionnée
  const filteredInvoices = selectedYear === 'all' 
    ? allInvoices 
    : allInvoices.filter(inv => new Date(inv.date).getFullYear() === parseInt(selectedYear))
  
  const filteredPurchases = selectedYear === 'all' 
    ? allPurchases 
    : allPurchases.filter(p => new Date(p.purchase_date).getFullYear() === parseInt(selectedYear))

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
  
  // Frais fixes depuis le début de l'année (ou de la période sélectionnée) jusqu'à maintenant
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const nowYear = now.getFullYear()
  
  let monthsElapsed = 1 // Par défaut au moins 1 mois
  if (selectedYear === 'all') {
    // Si toutes les années, on prend tous les mois écoulés
    const oldestYear = years.length > 0 ? Math.min(...years) : nowYear
    monthsElapsed = (nowYear - oldestYear) * 12 + currentMonth
  } else {
    const selectedYearNum = parseInt(selectedYear)
    if (selectedYearNum === nowYear) {
      // Si c'est l'année en cours, on prend les mois écoulés
      monthsElapsed = currentMonth
    } else if (selectedYearNum < nowYear) {
      // Si c'est une année passée, on prend 12 mois
      monthsElapsed = 12
    } else {
      // Si c'est une année future, 0 mois
      monthsElapsed = 0
    }
  }
  
  const fixedCostsForPeriod = fixedCostsMonthly * monthsElapsed

  // Calculs
  const totalRevenue = filteredInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0
  const totalPaid = filteredInvoices?.reduce((sum, inv) => sum + Number(inv.paid), 0) || 0
  const receivables = filteredInvoices?.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paid)), 0) || 0
  
  const purchasesPaid = filteredPurchases?.filter(p => p.paid).reduce((sum, p) => sum + (Number(p.quantity) * Number(p.unit_cost)), 0) || 0
  const payables = filteredPurchases?.filter(p => !p.paid).reduce((sum, p) => sum + (Number(p.quantity) * Number(p.unit_cost)), 0) || 0
  const totalPurchases = filteredPurchases?.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.unit_cost)), 0) || 0
  
  // URSSAF payé = somme des montants payés uniquement si une date de paiement existe
  const urssafPaid = filteredInvoices?.reduce((sum, inv) => sum + (inv.urssaf_paid_date ? Number(inv.urssaf_paid_amount) || 0 : 0), 0) || 0;
  // URSSAF dû = somme des montants URSSAF des factures non payées (pas de date de paiement)
  const urssafDue = filteredInvoices?.reduce((sum, inv) => sum + (!inv.urssaf_paid_date ? Number(inv.urssaf_amount) || 0 : 0), 0) || 0;
  const totalUrssaf = filteredInvoices?.reduce((sum, inv) => sum + Number(inv.urssaf_amount || 0), 0) || 0;
  
  const result = totalPaid - purchasesPaid - urssafPaid - fixedCostsMonthly
  
  // Prévisionnel = CA total - Achats totaux - URSSAF total - Frais fixes mensuels (projection si tout payé)
  const forecast = totalRevenue - totalPurchases - totalUrssaf - fixedCostsMonthly

  const stats = [
    { 
      label: 'CA', 
      value: totalPaid, 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      border: 'border-green-600',
      tooltip: 'Chiffre d\'affaires encaissé : somme de tous les paiements reçus sur les factures (colonne "Payé").'
    },
    { 
      label: 'Créances', 
      value: receivables, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      border: 'border-blue-600',
      tooltip: 'Montants facturés mais non encaissés : différence entre le total des factures et les paiements reçus (Total - Payé).'
    },
    { 
      label: 'Achats', 
      value: purchasesPaid, 
      color: 'text-gray-600', 
      bg: 'bg-gray-50', 
      border: 'border-gray-600',
      tooltip: 'Total des achats payés : somme des achats marqués comme payés (Quantité × Prix unitaire).'
    },
    { 
      label: 'Dettes', 
      value: payables, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50', 
      border: 'border-orange-600',
      tooltip: 'Achats non payés : somme des achats en attente de paiement (Quantité × Prix unitaire).'
    },
    { 
      label: 'URSSAF dû', 
      value: urssafDue, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      border: 'border-purple-600',
      tooltip: 'Montant URSSAF à payer : somme des cotisations URSSAF calculées sur les factures non encore déclarées comme payées.'
    },
    { 
      label: 'URSSAF payé', 
      value: urssafPaid, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50', 
      border: 'border-indigo-600',
      tooltip: 'Montant URSSAF déjà payé : somme des cotisations URSSAF avec une date de paiement enregistrée.'
    },
    { 
      label: 'Frais fixes/mois', 
      value: fixedCostsMonthly, 
      color: 'text-pink-600', 
      bg: 'bg-pink-50', 
      border: 'border-pink-600',
      tooltip: 'Frais fixes mensuels : somme des charges récurrentes converties en montant mensuel (loyer, abonnements, etc.).'
    },
    { 
      label: 'Résultat', 
      value: result, 
      color: result >= 0 ? 'text-green-600' : 'text-red-600', 
      bg: result >= 0 ? 'bg-green-50' : 'bg-red-50', 
      border: result >= 0 ? 'border-green-600' : 'border-red-600',
      tooltip: 'Résultat net : CA encaissé - Achats payés - URSSAF payé - Frais fixes mensuels.'
    },
    { 
      label: 'Prévisionnel', 
      value: forecast, 
      color: forecast >= 0 ? 'text-cyan-600' : 'text-red-600', 
      bg: forecast >= 0 ? 'bg-cyan-50' : 'bg-red-50', 
      border: forecast >= 0 ? 'border-cyan-600' : 'border-red-600',
      tooltip: 'Résultat si tout payé : CA total - Achats totaux - URSSAF total - Frais fixes mensuels. Projection si toutes les factures et charges de la période étaient réglées.'
    },
  ]

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Toutes les années</option>
          {years.map(year => (
            <option key={year} value={year.toString()}>{year}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`${stat.bg} ${stat.border} border-l-4 rounded-lg p-4 hover:shadow-lg transition-all relative group`}
        >
          <div className="flex items-center gap-1">
            <div className="text-sm font-medium text-gray-600">{stat.label}</div>
            <div className="relative">
              <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
              <div className={`invisible group-hover:visible absolute bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-[9999] ${
                index < 2 ? 'left-0' : index === stats.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'
              }`}>
                {stat.tooltip}
                <div className={`absolute top-full -mt-1 border-4 border-transparent border-t-gray-900 ${
                  index < 2 ? 'left-4' : index === stats.length - 1 ? 'right-4' : 'left-1/2 -translate-x-1/2'
                }`}></div>
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${stat.color} mt-1`}>
            {formatEuro(stat.value)}
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}
