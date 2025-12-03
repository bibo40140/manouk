"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
  created_at: string
  companies: Array<{ id: string; name: string }>
}

export default function AdminTab() {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<User[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingCompanyId, setEditingCompanyId] = useState<string>('')

  const loadData = async () => {
    console.log('loadData appelé')
    
    // Charger les sociétés via l'API (pour bypasser RLS)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      // Charger les sociétés
      const companiesRes = await fetch('/api/admin/list-companies', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (companiesRes.ok) {
        const companiesJson = await companiesRes.json()
        console.log('Sociétés chargées:', companiesJson.companies)
        setCompanies(companiesJson.companies || [])
        if (companiesJson.companies?.length > 0 && !companyId) {
          setCompanyId(companiesJson.companies[0].id)
        }
      } else {
        console.error('Erreur chargement sociétés:', companiesRes.status)
      }
      
      // Charger tous les utilisateurs
      const usersRes = await fetch('/api/admin/list-users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (usersRes.ok) {
        const json = await usersRes.json()
        console.log('Utilisateurs chargés:', json.users?.length)
        setUsers(json.users || [])
      } else {
        console.error('Erreur chargement utilisateurs:', usersRes.status)
      }
    }
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === 'fabien.hicauber@gmail.com') {
        setIsAdmin(true)
        await loadData()
      }
    })()
  }, [])

  const createUser = async () => {
    setMessage(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur API')
      setMessage({ text: 'Utilisateur créé et associé avec succès', type: 'success' })
      setEmail('')
      setPassword('')
      await loadData()
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const updateUserCompany = async (userId: string, newCompanyId: string) => {
    if (!newCompanyId) {
      setMessage({ text: 'Veuillez sélectionner une société', type: 'error' })
      return
    }
    
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/manage-user-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', userId, companyId: newCompanyId })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur API')
      
      setMessage({ text: json.message, type: 'success' })
      setEditingUserId(null)
      await loadData()
    } catch (e: any) {
      setMessage({ text: 'Erreur: ' + e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const addUserCompany = async (userId: string, newCompanyId: string) => {
    console.log('addUserCompany appelé', { userId, newCompanyId })
    
    if (!newCompanyId) {
      console.log('Erreur: companyId manquant')
      setMessage({ text: 'Veuillez sélectionner une société', type: 'error' })
      return
    }
    
    setLoading(true)
    setMessage(null)
    try {
      console.log('Envoi requête API...')
      const res = await fetch('/api/admin/manage-user-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', userId, companyId: newCompanyId })
      })
      console.log('Réponse reçue:', res.status)
      const json = await res.json()
      console.log('JSON:', json)
      if (!res.ok) throw new Error(json.error || 'Erreur API')
      
      setMessage({ text: json.message, type: 'success' })
      await loadData()
    } catch (e: any) {
      console.error('Erreur addUserCompany:', e)
      setMessage({ text: 'Erreur: ' + e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Supprimer définitivement l'utilisateur ${userEmail} ?`)) return
    
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur API')
      
      setMessage({ text: json.message, type: 'success' })
      await loadData()
    } catch (e: any) {
      console.error('Erreur deleteUser:', e)
      setMessage({ text: 'Erreur: ' + e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🛡️ Gestion des utilisateurs</h3>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Créer un nouvel utilisateur</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="user@example.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Société</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                value={companyId} 
                onChange={e => setCompanyId(e.target.value)}
              >
                <option value="">Sélectionner...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={createUser} 
                disabled={loading || !email || !password || !companyId} 
                className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création…' : '➕ Créer utilisateur'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Utilisateurs existants ({users.length})</h4>
        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun utilisateur trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Créé le</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Société(s)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {editingUserId === user.id ? (
                        <select 
                          className="px-2 py-1 border border-gray-300 rounded" 
                          value={editingCompanyId} 
                          onChange={e => setEditingCompanyId(e.target.value)}
                        >
                          {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        user.companies.length > 0 ? user.companies.map(c => c.name).join(', ') : <span className="text-gray-400 italic">Aucune société</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        {editingUserId === user.id ? (
                          <>
                            <button
                              onClick={() => {
                                if (user.companies.length > 0) {
                                  updateUserCompany(user.id, editingCompanyId)
                                } else {
                                  addUserCompany(user.id, editingCompanyId)
                                }
                              }}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                              disabled={loading || !editingCompanyId}
                            >
                              💾 Sauvegarder
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                            >
                              ✖️ Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingUserId(user.id)
                                setEditingCompanyId(user.companies.length > 0 ? user.companies[0].id : (companies.length > 0 ? companies[0].id : ''))
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              {user.companies.length > 0 ? '✏️ Modifier société' : '➕ Ajouter société'}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id, user.email)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              🗑️ Supprimer utilisateur
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
