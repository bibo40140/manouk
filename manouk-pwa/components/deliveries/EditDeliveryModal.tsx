'use client'

import { useMemo, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function EditDeliveryModal({ delivery, customers, allProductions, availableProductions, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState(delivery.customer_id || '')
  const [deliveryDate, setDeliveryDate] = useState(delivery.delivery_date || new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState(delivery.notes || '')
  
  // IDs des productions actuellement liées
  const currentProductionIds = (delivery.delivery_productions || []).map((dp: any) => dp.production_id)
  const [selectedIds, setSelectedIds] = useState<string[]>(currentProductionIds)

  // Productions disponibles pour la modification: productions actuelles + productions non livrées
  const editableProductions = useMemo(() => {
    // Créer un Set avec les IDs disponibles
    const availableIds = new Set(availableProductions.map((p: any) => p.id))
    
    // Combiner: productions déjà liées à cette livraison + productions disponibles
    const combined = allProductions.filter((p: any) => 
      currentProductionIds.includes(p.id) || availableIds.has(p.id)
    )
    
    // Trier par date de production (plus récent en premier)
    return combined.sort((a: any, b: any) => {
      return new Date(b.production_date).getTime() - new Date(a.production_date).getTime()
    })
  }, [allProductions, availableProductions, currentProductionIds])

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
      const res = await fetch('/api/update-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_id: delivery.id,
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

      alert('✅ Livraison modifiee avec succes !')
      onSuccess()
      onClose()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette livraison ? Le stock sera restaure.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/delete-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_id: delivery.id
        })
      })

      const data = await res.json()
      if (!data.ok) {
        alert('Erreur: ' + data.error)
        setLoading(false)
        return
      }

      alert('✅ Livraison supprimee avec succes !')
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
          <h2 className="text-xl font-bold">Modifier la livraison</h2>
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Productions a livrer
            </label>
            {editableProductions.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune production disponible.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
                {editableProductions.map((p: any) => (
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
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              disabled={loading}
            >
              🗑️ Supprimer
            </button>
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
              {loading ? 'Enregistrement...' : '✅ Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
