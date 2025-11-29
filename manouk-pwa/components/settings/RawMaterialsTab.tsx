'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RawMaterialsTab({ rawMaterials, companies }: any) {
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineData, setInlineData] = useState<any>({})
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('kg')
  const [unitCost, setUnitCost] = useState('')
  const [stock, setStock] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        name, 
        unit, 
        unit_cost: parseFloat(unitCost),
        stock: parseFloat(stock),
        company_id: companyId
      }

      if (editingMaterial) {
        const { error } = await supabase
          .from('raw_materials')
          .update(data)
          .eq('id', editingMaterial.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('raw_materials')
          .insert([data])
        if (error) throw error
      }

      setName('')
      setUnit('kg')
      setUnitCost('')
      setStock('')
      setCompanyId('')
      setEditingMaterial(null)
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (material: any) => {
    setEditingMaterial(material)
    setName(material.name)
    setUnit(material.unit)
    setUnitCost(material.unit_cost.toString())
    setStock(material.stock.toString())
    setCompanyId(material.company_id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette matière première ?')) return

    try {
      const { error } = await supabase
        .from('raw_materials')
        .delete()
        .eq('id', id)

      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une matière première</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Huile d'olive"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unité
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="kg">Kg</option>
              <option value="litre">Litre</option>
              <option value="g">Gramme</option>
              <option value="ml">Millilitre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coût unitaire (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="5.00"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            <input
              type="number"
              step="0.01"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="100"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Société
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              {companies.map((company: any) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Matières premières existantes</h3>
        {rawMaterials.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune matière première. Ajoutez-en une ci-dessus.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Unité</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Coût unitaire</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawMaterials.map((material: any) => {
                  const isEditing = inlineEditId === material.id
                  
                  if (isEditing) {
                    return (
                      <tr key={material.id} className="bg-indigo-50">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={inlineData.name || ''}
                            onChange={(e) => setInlineData({...inlineData, name: e.target.value})}
                            className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={inlineData.unit || 'kg'}
                            onChange={(e) => setInlineData({...inlineData, unit: e.target.value})}
                            className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="kg">Kg</option>
                            <option value="litre">Litre</option>
                            <option value="g">Gramme</option>
                            <option value="ml">Millilitre</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={inlineData.unit_cost || ''}
                            onChange={(e) => setInlineData({...inlineData, unit_cost: e.target.value})}
                            className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 text-right"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={inlineData.stock || ''}
                            onChange={(e) => setInlineData({...inlineData, stock: e.target.value})}
                            className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('raw_materials')
                                    .update({
                                      name: inlineData.name,
                                      unit: inlineData.unit,
                                      unit_cost: parseFloat(inlineData.unit_cost),
                                      stock: parseFloat(inlineData.stock)
                                    })
                                    .eq('id', material.id)
                                  if (error) throw error
                                  setInlineEditId(null)
                                  setInlineData({})
                                  router.refresh()
                                } catch (err: any) {
                                  alert('Erreur: ' + err.message)
                                }
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              💾 Sauvegarder
                            </button>
                            <button
                              onClick={() => {
                                setInlineEditId(null)
                                setInlineData({})
                              }}
                              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                            >
                              ✖️ Annuler
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }
                  
                  return (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{material.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{material.unit}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{material.unit_cost.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{material.stock} {material.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setInlineEditId(material.id)
                              setInlineData({
                                name: material.name,
                                unit: material.unit,
                                unit_cost: material.unit_cost.toString(),
                                stock: material.stock.toString()
                              })
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            ✏️ Éditer
                          </button>
                          <button
                            onClick={() => handleDelete(material.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            🗑️ Supprimer
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
    </div>
  )
}
