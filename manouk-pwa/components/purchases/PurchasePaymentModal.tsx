'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PurchasePaymentModal({ purchase, onClose }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('purchases')
        .update({ 
          paid: true,
          payment_date: paymentDate 
        })
        .eq('id', purchase.id)

      if (error) throw error

      router.refresh()
      onClose()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const total = Number(purchase.quantity) * Number(purchase.unit_cost)
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">
            Marquer l'achat comme payé
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Achat du {new Date(purchase.purchase_date).toLocaleDateString('fr-FR')}</div>
            <div className="text-sm text-gray-600 mt-1">{purchase.raw_material?.name || '-'}</div>
            <div className="text-lg font-bold text-gray-900 mt-2">{formatEuro(total)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {purchase.quantity} {purchase.raw_material?.unit || ''} × {formatEuro(Number(purchase.unit_cost))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de paiement *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Marquer comme payé'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
