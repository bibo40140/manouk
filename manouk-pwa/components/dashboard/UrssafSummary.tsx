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
    // Filtrer les factures du trimestre ET qui sont COMPLÈTEMENT payées
    const quarterInvoices = invoices.filter(inv => {
      const date = new Date(inv.date)
      const isPaid = Number(inv.paid) >= Number(inv.total) // Vérifier que le montant payé >= total
      return date.getFullYear() === currentYear && months.includes(date.getMonth()) && isPaid
    })
    
    const totalCA = quarterInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
    
    // URSSAF déclaré = factures avec urssaf_declared_date (déclaration effectuée)
    const invoicesDeclared = quarterInvoices.filter(inv => inv.urssaf_declared_date)
    const invoicesNotDeclared = quarterInvoices.filter(inv => !inv.urssaf_declared_date)
    
    const urssafDeclared = invoicesDeclared.reduce((sum, inv) => sum + (Number(inv.urssaf_amount) || 0), 0)
    const urssafNotDeclared = invoicesNotDeclared.reduce((sum, inv) => sum + (Number(inv.urssaf_amount) || 0), 0)
    
    const caDeclared = invoicesDeclared.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
    const caNotDeclared = invoicesNotDeclared.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
    
    const urssafPaid = quarterInvoices.reduce((sum, inv) => sum + (Number(inv.urssaf_paid_amount) || 0), 0)
    const urssafDue = urssafDeclared - urssafPaid
    
    console.log(`📊 URSSAF ${label}:`, { quarterInvoices: quarterInvoices.length, totalCA, urssafDeclared, urssafPaid })
    
    return { 
      q, label, totalCA, caDeclared, caNotDeclared,
      urssafDeclared, urssafNotDeclared, urssafPaid, urssafDue, 
      isCurrent: q === currentQuarter 
    }
  })

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        💼 URSSAF {currentYear}
      </h3>
      
      <div className="space-y-2">
        {quarterlyData.map(({ label, totalCA, caDeclared, caNotDeclared, urssafDeclared, urssafNotDeclared, urssafPaid, urssafDue, isCurrent }) => (
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
            
            {/* CA déclaré / à déclarer */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-2 pb-2 border-b">
              <div>
                <p className="text-gray-500">CA déclaré</p>
                <p className="font-medium text-green-600">{caDeclared.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-gray-500">CA à déclarer</p>
                <p className={`font-medium ${caNotDeclared > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                  {caNotDeclared.toFixed(2)} €
                </p>
              </div>
            </div>
            
            {/* URSSAF déclaré / à déclarer / payé / reste */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-gray-500">URSSAF déclaré</p>
                <p className="font-medium">{urssafDeclared.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-gray-500">À déclarer</p>
                <p className={`font-medium ${urssafNotDeclared > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                  {urssafNotDeclared.toFixed(2)} €
                </p>
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
