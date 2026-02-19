'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function EditProductionModal({ production, products, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState(production.product_id || '')
  const [quantity, setQuantity] = useState(production.quantity || 1)
  const [productionDate, setProductionDate] = useState(
    production.production_date || new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState(production.notes || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId || !quantity) {
      alert('Veuillez remplir tous les champs requis')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/update-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          production_id: production.id,
          product_id: productId,
          quantity: Number(quantity),
          production_date: productionDate,
          notes
        })
      })

      const data = await res.json()
      if (!data.ok) {
        alert('Erreur: ' + data.error)
        setLoading(false)
        return
      }

      alert('✅ Production modifiee avec succes !')
      onSuccess()
      onClose()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette production ? Le stock sera restaure.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/delete-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          production_id: production.id
        })
      })

      const data = await res. json()
      if (!data.ok) {
        alert('Erreur: ' + data.error)
        setLoading(false)
        return
      }

      alert('✅ Production supprimee avec succes !')
      onSuccess()
      onClose()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Modifier la production</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Selectionner...</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantite *</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de production *</label>
            <input
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
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
