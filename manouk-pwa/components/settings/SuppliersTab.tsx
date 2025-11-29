'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SuppliersTab({ suppliers, companies }: any) {
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineData, setInlineData] = useState<any>({})
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update({ name, company_id: companyId })
          .eq('id', editingSupplier.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([{ name, company_id: companyId }])
        if (error) throw error
      }

      setName('')
      setCompanyId('')
      setEditingSupplier(null)
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier)
    setName(supplier.name)
    setCompanyId(supplier.company_id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce fournisseur ?')) return

    try {
      const { error } = await supabase
        .from('suppliers')
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un fournisseur</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du fournisseur
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de l'entreprise"
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fournisseurs existants</h3>
        {suppliers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun fournisseur. Ajoutez-en un ci-dessus.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Société</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((supplier: any) => {
                  const isEditing = inlineEditId === supplier.id
                  
                  if (isEditing) {
                    return (
                      <tr key={supplier.id} className="bg-indigo-50">
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
                            value={inlineData.company_id || ''}
                            onChange={(e) => setInlineData({...inlineData, company_id: e.target.value})}
                            className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Sélectionner...</option>
                            {companies.map((company: any) => (
                              <option key={company.id} value={company.id}>{company.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('suppliers')
                                    .update({
                                      name: inlineData.name,
                                      company_id: inlineData.company_id
                                    })
                                    .eq('id', supplier.id)
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
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{supplier.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{supplier.company?.name || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setInlineEditId(supplier.id)
                              setInlineData({
                                name: supplier.name,
                                company_id: supplier.company_id
                              })
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            ✏️ Éditer
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
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
