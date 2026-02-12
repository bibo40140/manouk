'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CustomersTab({ customers, companies }: any) {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [siret, setSiret] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineData, setInlineData] = useState<any>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({ 
            name, 
            email, 
            address,
            phone,
            siret,
            vat_number: vatNumber,
            company_id: companyId 
          })
          .eq('id', editingCustomer.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{ 
            name, 
            email, 
            address,
            phone,
            siret,
            vat_number: vatNumber,
            company_id: companyId 
          }])
        if (error) throw error
      }

      setName('')
      setEmail('')
      setAddress('')
      setPhone('')
      setSiret('')
      setVatNumber('')
      setCompanyId('')
      setEditingCustomer(null)
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer)
    setName(customer.name)
    setEmail(customer.email || '')
    setAddress(customer.address || '')
    setPhone(customer.phone || '')
    setSiret(customer.siret || '')
    setVatNumber(customer.vat_number || '')
    setCompanyId(customer.company_id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const handleSaveInlineEdit = async () => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: inlineData.name,
          email: inlineData.email,
          phone: inlineData.phone,
          address: inlineData.address,
          company_id: inlineData.company_id,
          siret: inlineData.siret,
          vat_number: inlineData.vat_number
        })
        .eq('id', inlineEditId)
      if (error) throw error
      setInlineEditId(null)
      setInlineData({})
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const handleCancelInlineEdit = () => {
    setInlineEditId(null)
    setInlineData({})
  }


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un client</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du client *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom complet"
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
              placeholder="client@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse complète"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Société *
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIRET
            </label>
            <input
              type="text"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              placeholder="SIRET"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              N° TVA
            </label>
            <input
              type="text"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              placeholder="N° TVA"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ajout...' : editingCustomer ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clients existants</h3>
        {customers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun client. Ajoutez-en un ci-dessus.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Téléphone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Société</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer: any) => {
                  const isEditing = inlineEditId === customer.id
                  
                  if (isEditing) {
                    return (
                      <tr key={customer.id} className="bg-indigo-50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                              <input
                                type="text"
                                value={inlineData.name || ''}
                                onChange={(e) => setInlineData({...inlineData, name: e.target.value})}
                                className="w-full px-2 py-1 border border-indigo-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                              <input
                                type="email"
                                value={inlineData.email || ''}
                                onChange={(e) => setInlineData({...inlineData, email: e.target.value})}
                                className="w-full px-2 py-1 border border-indigo-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                              <input
                                type="text"
                                value={inlineData.phone || ''}
                                onChange={(e) => setInlineData({...inlineData, phone: e.target.value})}
                                className="w-full px-2 py-1 border border-indigo-300 rounded"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
                              <input
                                type="text"
                                value={inlineData.address || ''}
                                onChange={(e) => setInlineData({...inlineData, address: e.target.value})}
                                className="w-full px-2 py-1 border border-indigo-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Société</label>
                              <select
                                value={inlineData.company_id || ''}
                                onChange={(e) => setInlineData({...inlineData, company_id: e.target.value})}
                                className="w-full px-2 py-1 border border-indigo-300 rounded"
                              >
                                <option value="">Sélectionner...</option>
                                {companies.map((company: any) => (
                                  <option key={company.id} value={company.id}>{company.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">SIRET</label>
                              <input
                                type="text"
                                value={inlineData.siret || ''}
                                onChange={(e) => setInlineData({...inlineData, siret: e.target.value})}
                                className="w-full px-2 py-1 border border-indigo-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">N° TVA</label>
                              <input
                                type="text"
                                value={inlineData.vat_number || ''}
                                onChange={(e) => setInlineData({...inlineData, vat_number: e.target.value})}
                                className="w-full px-2 py-1 border border-indigo-300 rounded"
                              />
                            </div>
                            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                              <button
                                onClick={handleCancelInlineEdit}
                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={handleSaveInlineEdit}
                                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                              >
                                Enregistrer
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{customer.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{customer.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{customer.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {companies.find((c: any) => c.id === customer.company_id)?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setInlineEditId(customer.id)
                              setInlineData({
                                name: customer.name,
                                email: customer.email,
                                phone: customer.phone,
                                address: customer.address,
                                company_id: customer.company_id,
                                siret: customer.siret,
                                vat_number: customer.vat_number
                              })
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            ✏️ Éditer
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Supprimer ce client ?')) return
                              try {
                                const { error } = await supabase
                                  .from('customers')
                                  .delete()
                                  .eq('id', customer.id)
                                if (error) throw error
                                router.refresh()
                              } catch (err: any) {
                                alert('Erreur: ' + err.message)
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            🗑️
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
