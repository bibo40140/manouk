export default function RecentPurchases({ purchases }: { purchases: any[] }) {
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        🛒 Achats récents
      </h3>
      {purchases.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Aucun achat</p>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600">Matière</th>
                <th className="hidden sm:table-cell px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600">Fournisseur</th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-2 text-right text-xs font-semibold text-gray-600">Qté</th>
                <th className="px-3 sm:px-4 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                <th className="hidden sm:table-cell px-3 sm:px-4 py-2 text-center text-xs font-semibold text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                    {new Date(purchase.purchase_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">{purchase.raw_material?.name || '-'}</td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">{purchase.supplier?.name || '-'}</td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-900">{purchase.quantity}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-medium text-gray-900">
                    {formatEuro(Number(purchase.quantity) * Number(purchase.unit_cost))}
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3 text-center">
                    {purchase.paid ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Payé
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        En attente
                      </span>
                    )}
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
