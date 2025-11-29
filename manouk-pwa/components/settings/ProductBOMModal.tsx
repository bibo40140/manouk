'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ProductBOMModal({ product, rawMaterials, onClose }: any) {
  const router = useRouter()
  const supabase = createClient()
  
  const [materials, setMaterials] = useState<any[]>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProductMaterials()
  }, [product.id])

  const loadProductMaterials = async () => {
    const { data } = await supabase
      .from('product_materials')
      .select('*, raw_material:raw_materials(*)')
      .eq('product_id', product.id)
    
    setMaterials(data || [])
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('product_materials')
        .insert([{
          product_id: product.id,
          raw_material_id: selectedMaterialId,
          quantity: parseFloat(quantity)
        }])

      if (error) throw error

      setSelectedMaterialId('')
      setQuantity('')
      await loadProductMaterials()
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (materialId: string) => {
    if (!confirm('Retirer cette matière première ?')) return

    try {
      const { error } = await supabase
        .from('product_materials')
        .delete()
        .eq('product_id', product.id)
        .eq('raw_material_id', materialId)

      if (error) throw error

      await loadProductMaterials()
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const availableMaterials = rawMaterials.filter((rm: any) => 
    !materials.some((m: any) => m.raw_material_id === rm.id)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            Nomenclature: {product.name}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Formulaire d'ajout */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ajouter une matière première</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {availableMaterials.map((material: any) => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Quantité"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="col-span-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>

          {/* Liste des matières */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Composition actuelle</h3>
            {materials.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">
                Aucune matière première. Ajoutez-en une ci-dessus.
              </p>
            ) : (
              <div className="space-y-2">
                {materials.map((item: any) => (
                  <div
                    key={item.raw_material_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {item.raw_material?.name}
                      </span>
                      <span className="text-gray-600 ml-2 text-sm">
                        {item.quantity} {item.raw_material?.unit}
                      </span>
                      <span className="text-gray-500 ml-2 text-xs">
                        ({(item.quantity * item.raw_material?.unit_cost).toFixed(2)} €)
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(item.raw_material_id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium ml-4"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coût total */}
          {materials.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Coût total matières premières :</span>
                <span className="text-lg font-bold text-indigo-600">
                  {materials.reduce((sum, item) => sum + (item.quantity * (item.raw_material?.unit_cost || 0)), 0).toFixed(2)} €
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
