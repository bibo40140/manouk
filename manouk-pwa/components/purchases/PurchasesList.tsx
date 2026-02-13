'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import PurchasePaymentModal from './PurchasePaymentModal'

export default function PurchasesList({ purchases, companies, suppliers, rawMaterials }: any) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState<string | null>(null)
  const [paymentPurchase, setPaymentPurchase] = useState<any>(null)

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet achat ?')) return

    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)

      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const calculateStats = () => {
    const total = purchases.reduce((sum: number, p: any) => 
      sum + (Number(p.quantity) * Number(p.unit_cost)), 0
    )
    const paid = purchases.filter((p: any) => p.paid).reduce((sum: number, p: any) => 
      sum + (Number(p.quantity) * Number(p.unit_cost)), 0
    )
    const unpaid = total - paid

    return { total, paid, unpaid }
  }

  const stats = calculateStats()

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md border-l-4 border-gray-600 p-4">
          <div className="text-sm font-medium text-gray-600">Total des achats</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {formatEuro(stats.total)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border-l-4 border-green-600 p-4">
          <div className="text-sm font-medium text-gray-600">Payé</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {formatEuro(stats.paid)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border-l-4 border-orange-600 p-4">
          <div className="text-sm font-medium text-gray-600">À payer</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {formatEuro(stats.unpaid)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Liste des achats */}
        {purchases.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            Aucun achat. Créez-en un avec le bouton "Nouvel achat" ci-dessus.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Matière première</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Société</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Quantité</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Coût unitaire</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map((purchase: any) => {
                  const total = Number(purchase.quantity) * Number(purchase.unit_cost)
                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(purchase.purchase_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {purchase.raw_material?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {purchase.company?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {purchase.quantity} {purchase.raw_material?.unit || ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {formatEuro(Number(purchase.unit_cost))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatEuro(total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {purchase.paid ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Payé {purchase.payment_date ? `le ${new Date(purchase.payment_date).toLocaleDateString('fr-FR')}` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {!purchase.paid && (
                            <button
                              onClick={() => setPaymentPurchase(purchase)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              💰 Marquer comme payé
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(purchase.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de paiement */}
      {paymentPurchase && (
        <PurchasePaymentModal
          purchase={paymentPurchase}
          onClose={() => setPaymentPurchase(null)}
        />
      )}
    </div>
  )
}
