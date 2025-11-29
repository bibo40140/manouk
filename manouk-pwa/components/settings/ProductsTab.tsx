'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ProductBOMModal from './ProductBOMModal'

export default function ProductsTab({ products, companies, rawMaterials }: any) {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [bomProduct, setBomProduct] = useState<any>(null)
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineData, setInlineData] = useState<any>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        name, 
        price: parseFloat(price),
        company_id: companyId
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert([data])
        if (error) throw error
      }

      setName('')
      setPrice('')
      setCompanyId('')
      setEditingProduct(null)
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setName(product.name)
    setPrice(product.price?.toString() || '0')
    setCompanyId(product.company_id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const startInlineEdit = (product: any) => {
    setInlineEditId(product.id)
    setInlineData({
      name: product.name,
      price: product.price,
      company_id: product.company_id
    })
  }

  const cancelInlineEdit = () => {
    setInlineEditId(null)
    setInlineData({})
  }

  const saveInlineEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(inlineData)
        .eq('id', id)

      if (error) throw error
      setInlineEditId(null)
      setInlineData({})
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Savon lavande"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="10.50"
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
          <div className="flex items-end gap-2">
            {editingProduct && (
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null)
                  setName('')
                  setPrice('')
                  setCompanyId('')
                }}
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
              {loading ? (editingProduct ? 'Modification...' : 'Ajout...') : (editingProduct ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits existants</h3>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun produit. Ajoutez-en un ci-dessus.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Prix</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    {inlineEditId === product.id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={inlineData.name}
                            onChange={(e) => setInlineData({...inlineData, name: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={inlineData.price}
                            onChange={(e) => setInlineData({...inlineData, price: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => saveInlineEdit(product.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              💾 Sauvegarder
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                            >
                              ✖️ Annuler
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{Number(product.price || 0).toFixed(2)} €</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setBomProduct(product)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              🧱 Nomenclature
                            </button>
                            <button
                              onClick={() => startInlineEdit(product)}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              ✏️ Éditer
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {bomProduct && (
        <ProductBOMModal
          product={bomProduct}
          rawMaterials={rawMaterials || []}
          onClose={() => setBomProduct(null)}
        />
      )}
    </div>
  )
}
