'use client'

export default function TasksList({ invoices }: { invoices: any[] }) {
  const today = new Date()
  const unpaidInvoices = invoices.filter(inv => !inv.paid)
  const overdueInvoices = unpaidInvoices.filter(inv => new Date(inv.due_date) < today)
  const upcomingInvoices = unpaidInvoices.filter(inv => {
    const due = new Date(inv.due_date)
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  })

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span>📋</span>
        <span>À faire</span>
      </h3>
      
      <div className="space-y-3">
        {overdueInvoices.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="font-medium text-red-900 mb-1">
              🔴 {overdueInvoices.length} facture{overdueInvoices.length > 1 ? 's' : ''} en retard
            </p>
            <p className="text-sm text-red-700">
              Total: {overdueInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toFixed(2)} €
            </p>
          </div>
        )}
        
        {upcomingInvoices.length > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="font-medium text-yellow-900 mb-1">
              🟡 {upcomingInvoices.length} échéance{upcomingInvoices.length > 1 ? 's' : ''} cette semaine
            </p>
            <p className="text-sm text-yellow-700">
              Total: {upcomingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toFixed(2)} €
            </p>
          </div>
        )}
        
        {overdueInvoices.length === 0 && upcomingInvoices.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            ✅ Aucune tâche urgente
          </div>
        )}
      </div>
    </div>
  )
}
