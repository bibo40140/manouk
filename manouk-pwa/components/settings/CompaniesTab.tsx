  // Fonction pour supprimer une société
  const handleDelete = async (companyId: string) => {
    if (!window.confirm('Supprimer cette société ? Cette action est irréversible.')) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);
      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert('Erreur lors de la suppression : ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  'use client'

  // ...existing code...

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
  const [logo, setLogo] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [siret, setSiret] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [legalNotice, setLegalNotice] = useState('')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)

  // Fonction pour supprimer une société
  const handleDelete = async (companyId: string) => {
    if (!window.confirm('Supprimer cette société ? Cette action est irréversible.')) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);
      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert('Erreur lors de la suppression : ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const companyData = { code, name, email, logo, address, phone, siret, vat_number: vatNumber, legal_notice: legalNotice, website, user_id: user?.id };
      if (editingCompany) {
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', editingCompany.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('companies')
          .insert([companyData])
        if (error) throw error
      }

      setCode('')
      setName('')
      setEmail('')
      setLogo('')
      setAddress('')
      setPhone('')
      setSiret('')
      setVatNumber('')
      setLegalNotice('')
      setWebsite('')
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
    setLogo(company.logo || '')
    setAddress(company.address || '')
    setPhone(company.phone || '')
    setSiret(company.siret || '')
    setVatNumber(company.vat_number || '')
    setLegalNotice(company.legal_notice || '')
    setWebsite(company.website || '')
  }

  const handleCancelEdit = () => {
    setEditingCompany(null)
    setCode('')
    setName('')
    setEmail('')
    setLogo('')
    setAddress('')
    setPhone('')
    setSiret('')
    setVatNumber('')
    setLegalNotice('')
    setWebsite('')
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email d'envoi</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo (URL)</label>
            <input type="text" value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06..." className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
            <input type="text" value={siret} onChange={e => setSiret(e.target.value)} placeholder="123 456 789 00000" className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° TVA</label>
            <input type="text" value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="FRXX..." className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
            <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mention légale</label>
          <textarea value={legalNotice} onChange={e => setLegalNotice(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="TVA non applicable, article 293 B du CGI" />
        </div>
        <div className="flex gap-2 justify-end">
          {editingCompany && (
            <button type="button" onClick={handleCancelEdit} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Annuler</button>
          )}
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
            {editingCompany ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>


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
                        <td colSpan={12} className="px-4 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                              <input type="text" value={inlineData.code || ''} onChange={e => setInlineData({...inlineData, code: e.target.value})} className="w-full px-2 py-1 border border-indigo-300 rounded" placeholder="Code" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                              <input type="text" value={inlineData.name || ''} onChange={e => setInlineData({...inlineData, name: e.target.value})} className="w-full px-2 py-1 border border-indigo-300 rounded" placeholder="Nom" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Email d'envoi</label>
                              <input type="email" value={inlineData.email || ''} onChange={e => setInlineData({...inlineData, email: e.target.value})} className="w-full px-2 py-1 border border-indigo-300 rounded" placeholder="Email" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                              <input type="text" value={inlineData.phone || ''} onChange={e => setInlineData({...inlineData, phone: e.target.value})} className="w-full px-2 py-1 border border-indigo-300 rounded" placeholder="Téléphone" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">SIRET</label>
                              <input type="text" value={inlineData.siret || ''} onChange={e => setInlineData({...inlineData, siret: e.target.value})} className="w-full px-2 py-1 border border-indigo-300 rounded" placeholder="SIRET" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">N° TVA</label>
                              <input type="text" value={inlineData.vat_number || ''} onChange={e => setInlineData({...inlineData, vat_number: e.target.value})} className="w-full px-2 py-1 border border-indigo-300 rounded" placeholder="N° TVA" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Site web</label>
                              <input type="text" value={inlineData.website || ''} onChange={e => setInlineData({...inlineData, website: e.target.value})} className="w-full px-2 py-1 border border-indigo-300 rounded" placeholder="Site web" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
                              <textarea value={inlineData.address || ''} onChange={e => setInlineData({...inlineData, address: e.target.value})} className="w-full px-2 py-1 border border-indigo-300 rounded" placeholder="Adresse" rows={2} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Mention légale</label>
                              <textarea value={inlineData.legal_notice || ''} onChange={e => setInlineData({...inlineData, legal_notice: e.target.value})} className="w-full px-2 py-1 border border-indigo-300 rounded" placeholder="Mention légale" rows={2} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
                              <input type="file" accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setInlineData({ ...inlineData, logo: file });
                              }} />
                              {inlineData.logo && typeof inlineData.logo === 'string' && (
                                <img src={inlineData.logo} alt="logo" className="h-8 mt-1" />
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              onClick={async () => {
                                try {
                                  let logoUrl = inlineData.logo;
                                  // Upload du logo si c'est un fichier
                                  if (logoUrl && typeof logoUrl !== 'string') {
                                    const file = logoUrl;
                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `company_${company.id}_${Date.now()}.${fileExt}`;
                                    const { data, error: uploadError } = await supabase.storage
                                      .from('company-logos')
                                      .upload(fileName, file, { upsert: true });
                                    if (uploadError) throw uploadError;
                                    // Récupérer l'URL publique
                                    const { data: publicUrlData } = supabase.storage
                                      .from('company-logos')
                                      .getPublicUrl(fileName);
                                    logoUrl = publicUrlData?.publicUrl || '';
                                  }
                                  const updateData = {
                                    code: inlineData.code,
                                    name: inlineData.name,
                                    email: inlineData.email,
                                    phone: inlineData.phone,
                                    siret: inlineData.siret,
                                    vat_number: inlineData.vat_number,
                                    website: inlineData.website,
                                    address: inlineData.address,
                                    legal_notice: inlineData.legal_notice,
                                    logo: logoUrl
                                  };
                                  const { error } = await supabase
                                    .from('companies')
                                    .update(updateData)
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
                                code: company.code || '',
                                name: company.name || '',
                                email: company.email || '',
                                phone: company.phone || '',
                                siret: company.siret || '',
                                vat_number: company.vat_number || '',
                                website: company.website || '',
                                address: company.address || '',
                                legal_notice: company.legal_notice || '',
                                logo: company.logo || ''
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
