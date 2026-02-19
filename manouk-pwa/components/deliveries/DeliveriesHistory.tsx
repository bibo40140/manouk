
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(delivery.delivery_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {delivery.customer?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {summary.items.join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {summary.totalQty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
