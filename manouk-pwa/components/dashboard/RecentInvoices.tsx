export default function RecentInvoices({ invoices }: { invoices: any[] }) {
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        📄 Factures récentes
      </h3>
      {invoices.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Aucune facture</p>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                <th className="hidden sm:table-cell px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600">Client</th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-3 sm:px-4 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                <th className="hidden sm:table-cell px-3 sm:px-4 py-2 text-right text-xs font-semibold text-gray-600">Restant</th>
              </tr>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{invoice.invoice_number}</td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">{invoice.customer?.name || '-'}</td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                    {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-medium text-gray-900">
                    {formatEuro(Number(invoice.total))}
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-medium">
                    <span className={Number(invoice.total) - Number(invoice.paid) > 0 ? 'text-orange-600' : 'text-green-600'}>
                      {formatEuro(Number(invoice.total) - Number(invoice.paid))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
