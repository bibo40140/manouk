'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CompaniesTab({ companies }: any) {
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineData, setInlineData] = useState<any>({})
  const router = useRouter()
  const supabase = createClient()
  
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (editingCompany) {
        const { error } = await supabase
          .from('companies')
          .update({ code, name, email })
          .eq('id', editingCompany.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('companies')
          .insert([{ code, name, email, user_id: user?.id }])
        
        if (error) throw error
      }

      setCode('')
      setName('')
      setEmail('')
      setEditingCompany(null)
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (company: any) => {
    setEditingCompany(company)
    setCode(company.code)
    setName(company.name)
    setEmail(company.email || '')
  }

  const handleCancelEdit = () => {
    setEditingCompany(null)
    setCode('')
    setName('')
    setEmail('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette société ?')) return

    try {
      const { error } = await supabase
        .from('companies')
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingCompany ? 'Modifier la société' : 'Ajouter une société'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code unique
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ex: manouk"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la société"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@societe.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end gap-2">
            {editingCompany && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? (editingCompany ? 'Modification...' : 'Ajout...') : (editingCompany ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sociétés existantes</h3>
        {companies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune société. Ajoutez-en une ci-dessus.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((company: any) => {
                  const isEditing = inlineEditId === company.id
                  
                  if (isEditing) {
                    return (
                      <tr key={company.id} className="bg-indigo-50">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={inlineData.code || ''}
                            onChange={(e) => setInlineData({...inlineData, code: e.target.value})}
                            className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={inlineData.name || ''}
                            onChange={(e) => setInlineData({...inlineData, name: e.target.value})}
                            className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="email"
                            value={inlineData.email || ''}
                            onChange={(e) => setInlineData({...inlineData, email: e.target.value})}
                            className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('companies')
                                    .update({
                                      code: inlineData.code,
                                      name: inlineData.name,
                                      email: inlineData.email
                                    })
                                    .eq('id', company.id)
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
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{company.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{company.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{company.email || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setInlineEditId(company.id)
                              setInlineData({
                                code: company.code,
                                name: company.name,
                                email: company.email || ''
                              })
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            ✏️ Éditer
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
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
