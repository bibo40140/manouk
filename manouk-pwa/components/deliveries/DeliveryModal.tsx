'use client'

import { useMemo, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function DeliveryModal({ customers, productions, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const productionsSorted = useMemo(() => {
    return [...(productions || [])].sort((a: any, b: any) => {
      return new Date(b.production_date).getTime() - new Date(a.production_date).getTime()
    })
  }, [productions])

  const toggleProduction = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      alert('Veuillez selectionner un client')
      return
    }
    if (selectedIds.length === 0) {
      alert('Veuillez selectionner au moins une production')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/create-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          production_ids: selectedIds,
          delivery_date: deliveryDate,
          notes
        })
      })

      const data = await res.json()
      if (!data.ok) {
        alert('Erreur: ' + data.error)
        setLoading(false)
        return
      }

      alert('✅ Livraison enregistree avec succes !')
      onSuccess()
      onClose()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Nouvelle Livraison</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Selectionner...</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison *</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Ex: livraison du matin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Productions a livrer
            </label>
            {productionsSorted.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune production disponible.</p>
            ) : (
              <div className="space-y-2">
                {productionsSorted.map((p: any) => (
                  <label key={p.id} className="flex items-start gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleProduction(p.id)}
                    />
                    <div>
                      <div className="font-medium">{p.product?.name || 'Produit inconnu'}</div>
                      <div className="text-gray-600">Quantite: {p.quantity}</div>
                      <div className="text-gray-500">Production du {new Date(p.production_date).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Valider la livraison'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
