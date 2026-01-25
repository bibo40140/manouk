'use client'

export default function UrssafSummary({ invoices }: { invoices: any[] }) {
  console.log('📊 URSSAF - Factures reçues:', invoices?.length || 0)
  if (invoices && invoices.length > 0) {
    console.log('📊 URSSAF - Exemple de facture:', invoices[0])
  }
  
  const now = new Date()
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1
  const currentYear = now.getFullYear()
  
  // Calcul des trimestres
  const quarters = [
    { q: 1, label: 'T1', months: [0, 1, 2] },
    { q: 2, label: 'T2', months: [3, 4, 5] },
    { q: 3, label: 'T3', months: [6, 7, 8] },
    { q: 4, label: 'T4', months: [9, 10, 11] },
  ]
  
  const quarterlyData = quarters.map(({ q, label, months }) => {
    const quarterInvoices = invoices.filter(inv => {
      const date = new Date(inv.date)
      return date.getFullYear() === currentYear && months.includes(date.getMonth())
    })
    
    const totalCA = quarterInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
    const urssafDeclared = quarterInvoices.reduce((sum, inv) => sum + (Number(inv.urssaf_amount) || 0), 0)
    const urssafPaid = quarterInvoices.reduce((sum, inv) => sum + (Number(inv.urssaf_paid_amount) || 0), 0)
    const urssafDue = urssafDeclared - urssafPaid
    
    console.log(`📊 URSSAF ${label}:`, { quarterInvoices: quarterInvoices.length, totalCA, urssafDeclared, urssafPaid })
    
    return { q, label, totalCA, urssafDeclared, urssafPaid, urssafDue, isCurrent: q === currentQuarter }
  })

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        💼 URSSAF {currentYear}
      </h3>
      
      <div className="space-y-2">
        {quarterlyData.map(({ label, totalCA, urssafDeclared, urssafPaid, urssafDue, isCurrent }) => (
          <div 
            key={label} 
            className={`p-3 rounded-lg border ${
              isCurrent 
                ? 'bg-indigo-50 border-indigo-300' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">
                {label} {isCurrent && <span className="text-xs text-indigo-600">(actuel)</span>}
              </p>
              <p className="text-sm text-gray-600">CA: {totalCA.toFixed(2)} €</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Déclaré</p>
                <p className="font-medium">{urssafDeclared.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-gray-500">Payé</p>
                <p className="font-medium text-green-600">{urssafPaid.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-gray-500">Reste</p>
                <p className={`font-medium ${urssafDue > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {urssafDue.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
