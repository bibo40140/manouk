'use client'


import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ProductBOMModal from './ProductBOMModal'

export default function ProductsTab({ products: initialProducts, companies, rawMaterials }: any) {
  const router = useRouter()
  const supabase = createClient()

  const [products, setProducts] = useState<any[]>(initialProducts)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  // Répartition multi-sociétés
  const [splits, setSplits] = useState<any[]>(companies.map((c: any) => ({ company_id: c.id, amount: '' })))
  const [loading, setLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [bomProduct, setBomProduct] = useState<any>(null)
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineData, setInlineData] = useState<any>({})

  // Charge les produits et leurs splits depuis la base
  const fetchProductsWithSplits = async () => {
    // 1. Charge tous les produits
    const { data: productsData, error: prodError } = await supabase.from('products').select('*')
    if (prodError) {
      alert('Erreur chargement produits: ' + prodError.message)
      return
    }
    // 2. Charge tous les splits
    const { data: allSplits, error: splitError } = await supabase.from('product_company_splits').select('*')
    if (splitError) {
      alert('Erreur chargement splits: ' + splitError.message)
      return
    }
    // DEBUG LOG
    console.log('Produits bruts:', productsData);
    console.log('Splits bruts:', allSplits);
    const mapped = (productsData || []).map((p: any) => {
      const splits = companies.map((c: any) => {
        const found = allSplits?.find((s: any) => s.product_id === p.id && s.company_id === c.id);
        return { company_id: c.id, amount: found ? Number(found.amount) : 0 };
      });
      return { ...p, splits };
    });
    console.log('Produits avec splits:', mapped);
    setProducts(mapped);
  }

  useEffect(() => {
    fetchProductsWithSplits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let productId = editingProduct?.id;
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({ name, price: parseFloat(price) })
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([{ name, price: parseFloat(price) }])
          .select('id')
          .single();
        if (error) throw error;
        productId = data.id;
      }
      // Remove old splits if editing
      if (productId) {
        await supabase
          .from('product_company_splits')
          .delete()
          .eq('product_id', productId);
      }
      // Insert new splits (mapping explicite company_id <-> valeur)
      const splitsToInsert = companies.map((company: any) => {
        const split = splits.find((s: any) => s.company_id === company.id);
        return {
          product_id: productId,
          company_id: company.id,
          amount: split && split.amount !== '' && !isNaN(parseFloat(split.amount)) ? parseFloat(split.amount) : 0
        };
      });
      // DEBUG LOG
      console.log('Splits à insérer:', splitsToInsert);
      if (splitsToInsert.length > 0) {
        const { error: splitError } = await supabase
          .from('product_company_splits')
          .insert(splitsToInsert);
        if (splitError) throw splitError;
      }
      setName('');
      setPrice('');
      setSplits(companies.map((c: any) => ({ company_id: c.id, amount: '' })));
      setEditingProduct(null);
      await fetchProductsWithSplits();
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setName(product.name)
    setPrice(product.price?.toString() || '0')
    // Les splits seront chargés par l'effet ci-dessous
      setSplits(companies.map((c: any) => ({ company_id: c.id, amount: '' })))

  }

  // Effet pour charger les splits lors de l'édition d'un produit
  useEffect(() => {
    const loadSplits = async () => {
      if (!editingProduct) return
      // Import dynamique côté client
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: splitsData, error } = await supabase
        .from('product_company_splits')
        .select('*')
        .eq('product_id', editingProduct.id)
      if (error) {
        alert('Erreur chargement splits: ' + error.message)
        setSplits(companies.map((c: any) => ({ company_id: c.id, amount: '' })))
        return
      }
      setSplits(
        companies.map((c: any) => {
          const found = splitsData?.find((s: any) => s.company_id === c.id)
          return { company_id: c.id, amount: found ? found.amount : '' }
        })
      )
    }
    loadSplits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct])

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

  const startInlineEdit = async (product: any) => {
    setInlineEditId(product.id)
    // Charger les splits existants pour ce produit
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: splitsData, error } = await supabase
      .from('product_company_splits')
      .select('*')
      .eq('product_id', product.id)
    // Toujours initialiser splits comme un tableau de la bonne taille avec des strings
    const splits = companies.map((c: any) => {
      const found = splitsData?.find((s: any) => s.company_id === c.id)
      return { company_id: c.id, amount: found && found.amount !== undefined && found.amount !== null ? String(found.amount) : '' }
    })
    setInlineData({
      name: product.name,
      price: product.price !== undefined && product.price !== null ? String(product.price) : '',
      company_id: product.company_id,
      splits
    })
  }

  const cancelInlineEdit = () => {
    setInlineEditId(null)
    setInlineData({})
  }

  const saveInlineEdit = async (id: string) => {
    try {
      // Update product (name, price)
      const { error } = await supabase
        .from('products')
        .update({ name: inlineData.name, price: parseFloat(inlineData.price) })
        .eq('id', id);
      if (error) throw error;
      // Remove old splits
      await supabase
        .from('product_company_splits')
        .delete()
        .eq('product_id', id);
      // Insert new splits (mapping explicite company_id <-> valeur)
      const splitsToInsert = companies.map((company: any) => {
        const split = (inlineData.splits || []).find((s: any) => s.company_id === company.id);
        return {
          product_id: id,
          company_id: company.id,
          amount: split && split.amount !== '' && !isNaN(parseFloat(split.amount)) ? parseFloat(split.amount) : 0
        };
      });
      // DEBUG LOG
      console.log('Splits à insérer (inline):', splitsToInsert);
      if (splitsToInsert.length > 0) {
        const { error: splitError } = await supabase
          .from('product_company_splits')
          .insert(splitsToInsert);
        if (splitError) throw splitError;
      }
      setInlineEditId(null);
      setInlineData({});
      await fetchProductsWithSplits();
    } catch (err: any) {
      alert('Erreur: ' + err.message);
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Répartition par société (€)</label>
            <div className="flex gap-2">
              {companies.map((company: any) => {
                const split = splits.find((s: any) => s.company_id === company.id) || { amount: '' };
                return (
                  <div key={company.id} className="flex flex-col items-center">
                    <span className="text-xs text-gray-500">{company.name}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={split.amount}
                      onChange={e => {
                        setSplits((prev: any[]) => {
                          const found = prev.find((s: any) => s.company_id === company.id);
                          if (found) {
                            return prev.map((s: any) => s.company_id === company.id ? { ...s, amount: e.target.value } : s);
                          } else {
                            return [...prev, { company_id: company.id, amount: e.target.value }];
                          }
                        });
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
            >
              {editingProduct ? '💾 Enregistrer' : '➕ Ajouter'}
            </button>
            {editingProduct && (
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null)
                  setName('')
                  setPrice('')
                  setSplits(companies.map((c: any) => ({ company_id: c.id, amount: '' })))
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
              >
                ✖️ Annuler
              </button>
            )}
          </div>
        </form>
        <div className="mt-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Prix</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Répartition par société (€)</th>
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
                          value={typeof inlineData.name === 'string' ? inlineData.name : (inlineData.name !== undefined && inlineData.name !== null ? String(inlineData.name) : '')}
                          onChange={(e) => setInlineData({ ...inlineData, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={typeof inlineData.price === 'string' ? inlineData.price : (inlineData.price !== undefined && inlineData.price !== null ? String(inlineData.price) : '')}
                          onChange={(e) => setInlineData({ ...inlineData, price: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {companies.map((company: any, cidx: number) => (
                            <div key={company.id} className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">{company.name}</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={(() => {
                                  const found = (inlineData.splits || []).find((s: any) => s.company_id === company.id);
                                  return found ? found.amount : '';
                                })()}
                                onChange={e => {
                                  setInlineData((prev: any) => {
                                    const splits = Array.isArray(prev.splits) ? [...prev.splits] : [];
                                    const idx = splits.findIndex((s: any) => s.company_id === company.id);
                                    if (idx !== -1) {
                                      splits[idx] = { ...splits[idx], amount: e.target.value };
                                    } else {
                                      splits.push({ company_id: company.id, amount: e.target.value });
                                    }
                                    return { ...prev, splits };
                                  });
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => saveInlineEdit(product.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            💾 Sauvegarder
                          </button>
                          <button
                            type="button"
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
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {companies.map((company: any) => {
                            const split = product.splits?.find((s: any) => s.company_id === company.id);
                            let value = '0.00';
                            if (split && split.amount !== undefined && split.amount !== null && !isNaN(Number(split.amount))) {
                              value = Number(split.amount).toFixed(2);
                            }
                            return (
                              <div key={company.id} className="flex flex-col items-center">
                                <span className="text-xs text-gray-500">{company.name}</span>
                                <span className="text-xs">{value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
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
