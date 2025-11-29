'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UrssafDeclareModal({ invoice, onClose }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)

  const handleDeclare = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ urssaf_declared_date: date })
        .eq('id', invoice.id)

      if (error) throw error
      router.refresh()
      onClose()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Déclarer l'URSSAF</h2>
        <p className="text-gray-600 mb-4">
          Facture <strong>#{invoice.invoice_number}</strong>
        </p>
        <p className="text-lg font-semibold text-gray-900 mb-6">
          Montant URSSAF : {Number(invoice.urssaf_amount || 0).toFixed(2)} €
        </p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de déclaration *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleDeclare}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Déclarer'}
          </button>
        </div>
      </div>
    </div>
  )
}
