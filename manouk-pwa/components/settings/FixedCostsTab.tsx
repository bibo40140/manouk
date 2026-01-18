'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FixedCostsTab({ initialFixedCosts, companies }: any) {
  const [fixedCosts, setFixedCosts] = useState(initialFixedCosts || [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [isAdding, setIsAdding] = useState(false)
  const [newCost, setNewCost] = useState({ name: '', amount: 0, frequency: 'monthly', company_id: companies?.[0]?.id || '' })
  const supabase = createClient()

  const startEdit = (cost: any) => {
    setEditingId(cost.id)
    setEditForm({ ...cost })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from('fixed_costs')
      .update({
        name: editForm.name,
        amount: editForm.amount,
        frequency: editForm.frequency,
        company_id: editForm.company_id
      })
      .eq('id', id)

    if (error) {
      alert('Erreur: ' + error.message)
      return
    }

    setFixedCosts(fixedCosts.map((c: any) => c.id === id ? { ...c, ...editForm } : c))
    setEditingId(null)
    setEditForm({})
  }

  const deleteCost = async (id: string) => {
    if (!confirm('Supprimer ce frais fixe ?')) return

    const { error } = await supabase.from('fixed_costs').delete().eq('id', id)
    if (error) {
      alert('Erreur: ' + error.message)
      return
    }

    setFixedCosts(fixedCosts.filter((c: any) => c.id !== id))
  }

  const addCost = async () => {
    if (!newCost.name.trim()) {
      alert('Le nom est requis')
      return
    }

    const { data, error } = await supabase
      .from('fixed_costs')
      .insert([newCost])
      .select()
      .single()

    if (error) {
      alert('Erreur: ' + error.message)
      return
    }

    setFixedCosts([...fixedCosts, data])
    setNewCost({ name: '', amount: 0, frequency: 'monthly', company_id: companies?.[0]?.id || '' })
    setIsAdding(false)
  }

  const getMonthlyAmount = (amount: number, frequency: string) => {
    switch(frequency) {
      case 'yearly': return amount / 12
      case 'quarterly': return amount / 3
      default: return amount
    }
  }

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Frais fixes</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Ajouter un frais fixe
        </button>
      </div>

      {isAdding && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Nouveau frais fixe</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Nom (ex: Loyer)"
              value={newCost.name}
              onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Montant"
              value={newCost.amount || ''}
              onChange={(e) => setNewCost({ ...newCost, amount: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newCost.frequency}
              onChange={(e) => setNewCost({ ...newCost, frequency: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Mensuel</option>
              <option value="quarterly">Trimestriel</option>
              <option value="yearly">Annuel</option>
            </select>
            <select
              value={newCost.company_id}
              onChange={(e) => setNewCost({ ...newCost, company_id: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {companies?.map((company: any) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={addCost}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              ✓ Enregistrer
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewCost({ name: '', amount: 0, frequency: 'monthly', company_id: companies?.[0]?.id || '' })
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              ✗ Annuler
            </button>
          </div>
        </div>
      )}

      {fixedCosts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Aucun frais fixe. Cliquez sur le bouton pour en ajouter.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Montant</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Fréquence</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Montant/mois</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Société</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fixedCosts.map((cost: any) => {
                const isEditing = editingId === cost.id
                const company = companies?.find((c: any) => c.id === cost.company_id)

                return (
                  <tr key={cost.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{cost.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 border rounded text-sm text-right"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{formatEuro(cost.amount)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <select
                          value={editForm.frequency}
                          onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="monthly">Mensuel</option>
                          <option value="quarterly">Trimestriel</option>
                          <option value="yearly">Annuel</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-600">
                          {cost.frequency === 'monthly' && 'Mensuel'}
                          {cost.frequency === 'quarterly' && 'Trimestriel'}
                          {cost.frequency === 'yearly' && 'Annuel'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-blue-600">
                        {formatEuro(getMonthlyAmount(isEditing ? editForm.amount : cost.amount, isEditing ? editForm.frequency : cost.frequency))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={editForm.company_id}
                          onChange={(e) => setEditForm({ ...editForm, company_id: e.target.value })}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          {companies?.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-700">{company?.name || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(cost.id)}
                              className="text-green-600 hover:text-green-800 text-xs font-medium"
                            >
                              ✓ Sauver
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                            >
                              ✗ Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(cost)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => deleteCost(cost.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-medium"
                            >
                              🗑️ Supprimer
                            </button>
                          </>
                        )}
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
  )
}
