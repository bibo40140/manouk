'use client'

export default function MonthlyTrends({ 
  invoices, 
  purchases,
  fixedCosts 
}: { 
  invoices: any[]
  purchases: any[]
  fixedCosts: any[]
}) {
  const now = new Date()
  const months = []
  
  // Générer les 6 derniers mois
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: date.getMonth(),
      year: date.getFullYear(),
      label: date.toLocaleDateString('fr-FR', { month: 'short' })
    })
  }
  
  console.log('📊 MonthlyTrends - Mois générés:', months)
  console.log('📊 MonthlyTrends - Invoices:', invoices.length, invoices)
  console.log('📊 MonthlyTrends - Purchases:', purchases.length, purchases)
  console.log('📊 MonthlyTrends - FixedCosts:', fixedCosts.length, fixedCosts)
  
  // Calculer les totaux par mois
  const monthlyData = months.map(({ month, year, label }) => {
    const monthInvoices = invoices.filter(inv => {
      const date = new Date(inv.invoice_date)
      return date.getMonth() === month && date.getFullYear() === year
    })
    
    const monthPurchases = purchases.filter(p => {
      const date = new Date(p.purchase_date)
      return date.getMonth() === month && date.getFullYear() === year
    })
    
    const revenue = monthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const costs = monthPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0)
    
    // Frais fixes mensuels
    const monthlyFixed = fixedCosts.reduce((sum, fc) => {
      const amount = fc.amount || 0
      if (fc.frequency === 'monthly') return sum + amount
      if (fc.frequency === 'quarterly') return sum + (amount / 3)
      if (fc.frequency === 'yearly') return sum + (amount / 12)
      return sum
    }, 0)
    
    const profit = revenue - costs - monthlyFixed
    
    return { label, revenue, costs, profit, fixedCosts: monthlyFixed }
  })

  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.revenue, d.costs)))

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 Tendances 6 mois
      </h3>
      
      <div className="space-y-4">
        {monthlyData.map((data, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{data.label}</span>
              <span className={`font-semibold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.profit >= 0 ? '+' : ''}{data.profit.toFixed(0)} €
              </span>
            </div>
            <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-green-500 opacity-60"
                style={{ width: `${(data.revenue / maxValue) * 100}%` }}
              />
              <div 
                className="absolute left-0 top-0 h-full bg-red-500 opacity-60"
                style={{ width: `${(data.costs / maxValue) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>CA: {data.revenue.toFixed(0)} €</span>
              <span>Dép: {(data.costs + data.fixedCosts).toFixed(0)} €</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Chiffre d'affaires</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">Dépenses</span>
        </div>
      </div>
    </div>
  )
}
