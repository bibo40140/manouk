"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type UserCompany = {
  user_id: string
  email: string
  company_id: string
  company_name: string
  role: string
}

type EditingUser = {
  user_id: string
  company_id: string
  email: string
  role: string
  company_name: string
}

export default function AdminTab() {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<UserCompany[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null)

  const loadUsers = async () => {
    // Récupérer tous les utilisateurs avec leurs sociétés via l'API
    try {
      const res = await fetch('/api/admin/list-users')
      const json = await res.json()
      if (res.ok && json.users) {
        setUsers(json.users)
      } else {
        console.error('Erreur chargement utilisateurs:', json.error)
      }
    } catch (e) {
      console.error('Erreur chargement utilisateurs:', e)
    }
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === 'fabien.hicauber@gmail.com') {
        setIsAdmin(true)
        const { data, error } = await supabase.from('companies').select('id, name').order('name')
        if (!error && data) {
          setCompanies(data)
          if (data.length > 0) setCompanyId(data[0].id)
        }
        await loadUsers()
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
        body: JSON.stringify({ email, companyId, role, password: password || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur API')
      setMessage('Utilisateur créé et associé avec succès')
      setEmail('')
      setPassword('')
      await loadUsers() // Recharger la liste
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteUserCompany = async (userId: string, companyId: string) => {
    if (!confirm('Supprimer cette association utilisateur-société ?')) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/admin/manage-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, companyId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur suppression')
      setMessage('Association supprimée')
      await loadUsers()
    } catch (e: any) {
      setMessage('Erreur : ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async () => {
    if (!editingUser) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/admin/manage-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: editingUser.user_id, 
          companyId: editingUser.company_id,
          newRole: editingUser.role 
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur mise à jour')
      setMessage('Rôle mis à jour')
      setEditingUser(null)
      await loadUsers()
    } catch (e: any) {
      setMessage('Erreur : ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (userId: string, email: string) => {
    if (!confirm(`Envoyer un email de réinitialisation à ${email} ?`)) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur réinitialisation')
      setMessage(json.message || 'Email de réinitialisation envoyé')
    } catch (e: any) {
      setMessage('Erreur : ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Admin — Gestion des utilisateurs</h3>
      
      {/* Section création */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h4 className="font-medium">Créer un nouvel utilisateur</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email utilisateur</label>
            <input className="w-full px-3 py-2 border rounded" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ex: user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe (optionnel)</label>
            <input className="w-full px-3 py-2 border rounded" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Laisser vide pour envoyer invitation" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Société</label>
            <select className="w-full px-3 py-2 border rounded" value={companyId} onChange={e => setCompanyId(e.target.value)}>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rôle</label>
            <select className="w-full px-3 py-2 border rounded" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Membre</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={createUser} disabled={loading || !email || !companyId} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">
            {loading ? 'Création…' : 'Créer et associer'}
          </button>
          {message && <p className="text-sm text-gray-700">{message}</p>}
        </div>
      </div>

      {/* Section liste des utilisateurs */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Utilisateurs existants ({users.length})</h4>
          <button onClick={loadUsers} className="text-sm px-3 py-1 border rounded hover:bg-gray-50">
            Actualiser
          </button>
        </div>
        
        {users.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun utilisateur trouvé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Société</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u, idx) => (
                  <tr key={`${u.user_id}-${u.company_id}-${idx}`}>
                    <td className="px-4 py-2 text-sm">{u.email}</td>
                    <td className="px-4 py-2 text-sm">{u.company_name}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm space-x-2">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifier le rôle"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => resetPassword(u.user_id, u.email)}
                        className="text-orange-600 hover:text-orange-800"
                        title="Réinitialiser le mot de passe"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => deleteUserCompany(u.user_id, u.company_id)}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Modifier l'utilisateur</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input className="w-full px-3 py-2 border rounded bg-gray-100" type="text" value={editingUser.email} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Société</label>
                <input className="w-full px-3 py-2 border rounded bg-gray-100" type="text" value={editingUser.company_name} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <select 
                  className="w-full px-3 py-2 border rounded" 
                  value={editingUser.role} 
                  onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                >
                  <option value="member">Membre</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button 
                onClick={updateUserRole} 
                disabled={loading}
                className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button 
                onClick={() => setEditingUser(null)} 
                className="px-4 py-2 rounded border"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
