'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function PaymentModal({ invoice, onClose }: any) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('virement')

  const remaining = Number(invoice.total) - Number(invoice.paid)

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const paymentAmount = parseFloat(amount)
    
    if (paymentAmount <= 0 || paymentAmount > remaining) {
      alert(`Le montant doit être entre 0 et ${formatEuro(remaining)}`)
      return
    }
    
    setLoading(true)

    try {
      // Enregistrer le paiement
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          invoice_id: invoice.id,
          amount: paymentAmount,
          date: paymentDate
        }])

      if (paymentError) throw paymentError

      // Mettre à jour le montant payé de la facture
      const newPaidAmount = Number(invoice.paid) + paymentAmount
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ paid: newPaidAmount })
        .eq('id', invoice.id)

      if (updateError) throw updateError

      onClose()
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">
            Enregistrer un paiement
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
            <div className="text-sm text-gray-600">Facture {invoice.invoice_number}</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              Restant dû : {formatEuro(remaining)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant du paiement (€) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={remaining.toFixed(2)}
              required
              max={remaining}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum : {formatEuro(remaining)}
            </p>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Méthode de paiement *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
              <option value="especes">Espèces</option>
              <option value="carte">Carte bancaire</option>
              <option value="prelevement">Prélèvement</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
