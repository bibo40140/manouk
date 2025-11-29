'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PurchasesList({ purchases, companies, suppliers, rawMaterials }: any) {
  const router = useRouter()
  const supabase = createClient()
  
  const [companyFilter, setCompanyFilter] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const filteredPurchases = purchases.filter((purchase: any) => 
    !companyFilter || purchase.company_id === companyFilter
  )

  const handleTogglePaid = async (purchase: any) => {
    setLoading(purchase.id)
    
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ paid: !purchase.paid })
        .eq('id', purchase.id)

      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(null)
    }
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
    const total = filteredPurchases.reduce((sum: number, p: any) => 
      sum + (Number(p.quantity) * Number(p.unit_cost)), 0
    )
    const paid = filteredPurchases.filter((p: any) => p.paid).reduce((sum: number, p: any) => 
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
        {/* Filtre */}
        {companies.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par société
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Toutes les sociétés</option>
              {companies.map((company: any) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Liste des achats */}
        {filteredPurchases.length === 0 ? (
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Fournisseur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Société</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Quantité</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Coût unitaire</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.map((purchase: any) => {
                  const total = Number(purchase.quantity) * Number(purchase.unit_cost)
                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(purchase.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {purchase.raw_material?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {purchase.supplier?.name || '-'}
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
                        <button
                          onClick={() => handleTogglePaid(purchase)}
                          disabled={loading === purchase.id}
                          className="disabled:opacity-50"
                        >
                          {purchase.paid ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 cursor-pointer hover:bg-green-200">
                              Payé
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200">
                              En attente
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
