
'use client'

import { useState } from 'react'
import DeliveryButton from '@/components/dashboard/DeliveryButton'
import MarkInvoicedModal from '@/components/deliveries/MarkInvoicedModal'
import EditDeliveryModal from '@/components/deliveries/EditDeliveryModal'

export default function DeliveriesHistory({ deliveries, customers, productions, allProductions }: any) {
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  const [editingDelivery, setEditingDelivery] = useState<any>(null)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getSummary = (delivery: any) => {
    const items = (delivery.delivery_productions || []).map((dp: any) => {
      const production = dp.production
      const name = production?.product?.name || 'Produit'
      const qty = production?.quantity || 0
      return `${name} x${qty}`
    })
    const totalQty = (delivery.delivery_productions || []).reduce((sum: number, dp: any) => {
      return sum + Number(dp.production?.quantity || 0)
    }, 0)
    return { items, totalQty }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DeliveryButton customers={customers} productions={productions} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Vue CARTE sur mobile */}
        <div className="md:hidden space-y-3 p-4">
          {(deliveries || []).length === 0 ? (
            <p className="text-center text-gray-500">Aucune livraison</p>
          ) : (
            deliveries.map((delivery: any) => {
              const summary = getSummary(delivery)
              const status = delivery.invoiced_at ? 'Facturee' : 'A facturer'
              return (
                <div key={delivery.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{delivery.customer?.name || '-'}</p>
                      <p className="text-xs text-gray-600">{formatDate(delivery.delivery_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{summary.totalQty} article(s)</p>
                      <p className="text-xs text-gray-600">{status}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">Produits: {summary.items.join(', ')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingDelivery(delivery)}
                      className="flex-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded hover:bg-indigo-50 transition-colors"
                    >
                      ✏️ Modifier
                    </button>
                    {!delivery.invoiced_at && (
                      <button
                        onClick={() => setSelectedDelivery(delivery)}
                        className="flex-1 px-2 py-1 text-xs text-green-600 hover:text-green-800 border border-green-200 rounded hover:bg-green-50 transition-colors"
                      >
                        📄 Facturer
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Vue TABLE sur desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produits</th>
                <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(deliveries || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucune livraison
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery: any) => {
                  const summary = getSummary(delivery)
                  const status = delivery.invoiced_at ? 'Facturee' : 'A facturer'
                  return (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {formatDate(delivery.delivery_date)}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                        {delivery.customer?.name || '-'}
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-700">
                        {summary.items.join(', ')}
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {summary.totalQty}
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                        {status}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingDelivery(delivery)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            ✏️ Modifier
                          </button>
                          {!delivery.invoiced_at && (
                            <button
                              onClick={() => setSelectedDelivery(delivery)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              📄 Marquer facturee
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDelivery && (
        <MarkInvoicedModal
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}

      {editingDelivery && (
        <EditDeliveryModal
          delivery={editingDelivery}
          customers={customers}
          allProductions={allProductions}
          availableProductions={productions}
          onClose={() => setEditingDelivery(null)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
