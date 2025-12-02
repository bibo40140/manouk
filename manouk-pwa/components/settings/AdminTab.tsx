"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminTab() {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [email, setEmail] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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
        body: JSON.stringify({ email, companyId, role }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur API')
      setMessage('Utilisateur créé et associé avec succès')
      setEmail('')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Admin — Gestion des utilisateurs</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email utilisateur</label>
          <input className="w-full px-3 py-2 border rounded" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ex: user@example.com" />
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
  )
}
