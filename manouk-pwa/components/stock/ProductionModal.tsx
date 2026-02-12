'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ProductionModal({ products, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || quantity <= 0) {
      alert('Veuillez sélectionner un produit et une quantité valide')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/create-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity,
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

      alert('✅ Production enregistrée avec succès !')
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
          <h2 className="text-xl font-bold">Nouvelle Production</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produit à fabriquer
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Sélectionner...</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock actuel: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité produite
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de production
            </label>
            <input
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Ex: Lot spécial, commande urgente..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            ℹ️ Les matières premières seront automatiquement décomptées selon la nomenclature (BOM) du produit.
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
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Valider la production'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
