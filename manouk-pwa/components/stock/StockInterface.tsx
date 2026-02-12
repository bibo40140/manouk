"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProductionModal from './ProductionModal'

type RawMaterial = {
  id: string
  name: string
  unit: string
  unit_cost: number
  stock: number
  alert_threshold?: number
}

type Product = {
  id: string
  name: string
  price: number
  stock: number
  alert_threshold?: number
}

type Company = {
  id: string
  name: string
  email: string | null
}

type Props = {
  rawMaterials: RawMaterial[]
  products: Product[]
  companies: Company[]
}

export default function StockInterface({ rawMaterials: initialRawMaterials, products: initialProducts, companies }: Props) {
  const supabase = createClient()
  const [rawMaterials, setRawMaterials] = useState(initialRawMaterials)
  const [products, setProducts] = useState(initialProducts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<'material' | 'product' | null>(null)
  const [threshold, setThreshold] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [editingStock, setEditingStock] = useState<{ id: string; type: 'material' | 'product'; value: number } | null>(null)
  const [showProductionModal, setShowProductionModal] = useState(false)

  const updateStock = async (id: string, type: 'material' | 'product', newStock: number) => {
    try {
      const table = type === 'material' ? 'raw_materials' : 'products'
      const { error } = await supabase
        .from(table)
        .update({ stock: newStock })
        .eq('id', id)

      if (error) throw error

      // Mettre à jour l'état local
      if (type === 'material') {
        setRawMaterials(prev => prev.map(m => m.id === id ? { ...m, stock: newStock } : m))
      } else {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p))
      }

      setMessage('Stock mis à jour')
      setEditingStock(null)
      setTimeout(() => setMessage(null), 3000)
    } catch (e: any) {
      setMessage('Erreur : ' + e.message)
    }
  }

  const updateThreshold = async (id: string, type: 'material' | 'product', newThreshold: number) => {
    try {
      const table = type === 'material' ? 'raw_materials' : 'products'
      const { error } = await supabase
        .from(table)
        .update({ alert_threshold: newThreshold })
        .eq('id', id)

      if (error) throw error

      // Mettre à jour l'état local
      if (type === 'material') {
        setRawMaterials(prev => prev.map(m => m.id === id ? { ...m, alert_threshold: newThreshold } : m))
      } else {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, alert_threshold: newThreshold } : p))
      }

      setMessage('Seuil d\'alerte mis à jour')
      setEditingId(null)
      setEditingType(null)
      setTimeout(() => setMessage(null), 3000)
    } catch (e: any) {
      setMessage('Erreur : ' + e.message)
    }
  }

  const sendAlert = async (companyEmail: string, itemName: string, stock: number, type: string) => {
    try {
      const res = await fetch('/api/stock/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyEmail, itemName, stock, type })
      })
      
      if (!res.ok) throw new Error('Erreur envoi email')
      
      setMessage(`Alerte envoyée à ${companyEmail}`)
      setTimeout(() => setMessage(null), 3000)
    } catch (e: any) {
      setMessage('Erreur : ' + e.message)
    }
  }

  const getStockStatus = (stock: number, threshold?: number) => {
    if (!threshold) return 'normal'
    if (stock <= 0) return 'empty'
    if (stock <= threshold) return 'low'
    return 'normal'
  }

  const getStockColor = (status: string) => {
    switch (status) {
      case 'empty': return 'bg-red-100 text-red-800'
      case 'low': return 'bg-orange-100 text-orange-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded">
          {message}
        </div>
      )}

      {/* Bouton Nouvelle Production */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowProductionModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
        >
          <span>🏭</span>
          <span>Nouvelle Production</span>
        </button>
      </div>

      {/* Matières premières */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Matières Premières</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock actuel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seuil d'alerte</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rawMaterials.map((material) => {
                const status = getStockStatus(material.stock, material.alert_threshold)
                const isEditing = editingId === material.id && editingType === 'material'
                const isEditingStock = editingStock?.id === material.id && editingStock?.type === 'material'
                
                return (
                  <tr key={material.id}>
                    <td className="px-4 py-3 text-sm font-medium">{material.name}</td>
                    <td className="px-4 py-3 text-sm">
                      {isEditingStock ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={editingStock.value}
                            onChange={(e) => setEditingStock({ ...editingStock, value: Number(e.target.value) })}
                            className="w-24 px-2 py-1 border rounded"
                            min="0"
                            step="1"
                          />
                          <span className="text-gray-500">{material.unit}</span>
                          <button
                            onClick={() => updateStock(material.id, 'material', editingStock.value)}
                            className="text-green-600 hover:text-green-800 font-bold"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingStock(null)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span>{material.stock} {material.unit}</span>
                          <button
                            onClick={() => setEditingStock({ id: material.id, type: 'material', value: material.stock })}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="Modifier le stock"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded"
                          />
                          <button
                            onClick={() => updateThreshold(material.id, 'material', threshold)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditingType(null); }}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span>{material.alert_threshold || 'Non défini'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStockColor(status)}`}>
                        {status === 'empty' ? 'Rupture' : status === 'low' ? 'Stock faible' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => {
                          setEditingId(material.id)
                          setEditingType('material')
                          setThreshold(material.alert_threshold || 0)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Définir seuil"
                      >
                        ⚙️
                      </button>
                      {status !== 'normal' && companies[0]?.email && (
                        <button
                          onClick={() => sendAlert(companies[0].email!, material.name, material.stock, 'matière première')}
                          className="text-orange-600 hover:text-orange-800"
                          title="Envoyer alerte"
                        >
                          📧
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Produits */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Produits</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock actuel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seuil d'alerte</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const status = getStockStatus(product.stock, product.alert_threshold)
                const isEditing = editingId === product.id && editingType === 'product'
                const isEditingStock = editingStock?.id === product.id && editingStock?.type === 'product'
                
                return (
                  <tr key={product.id}>
                    <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-sm">
                      {isEditingStock ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={editingStock.value}
                            onChange={(e) => setEditingStock({ ...editingStock, value: Number(e.target.value) })}
                            className="w-24 px-2 py-1 border rounded"
                            min="0"
                            step="1"
                          />
                          <button
                            onClick={() => updateStock(product.id, 'product', editingStock.value)}
                            className="text-green-600 hover:text-green-800 font-bold"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingStock(null)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span>{product.stock}</span>
                          <button
                            onClick={() => setEditingStock({ id: product.id, type: 'product', value: product.stock })}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="Modifier le stock"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded"
                          />
                          <button
                            onClick={() => updateThreshold(product.id, 'product', threshold)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditingType(null); }}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span>{product.alert_threshold || 'Non défini'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStockColor(status)}`}>
                        {status === 'empty' ? 'Rupture' : status === 'low' ? 'Stock faible' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => {
                          setEditingId(product.id)
                          setEditingType('product')
                          setThreshold(product.alert_threshold || 0)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Définir seuil"
                      >
                        ⚙️
                      </button>
                      {status !== 'normal' && companies[0]?.email && (
                        <button
                          onClick={() => sendAlert(companies[0].email!, product.name, product.stock, 'produit')}
                          className="text-orange-600 hover:text-orange-800"
                          title="Envoyer alerte"
                        >
                          📧
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de production */}
      {showProductionModal && (
        <ProductionModal
          products={products}
          onClose={() => setShowProductionModal(false)}
          onSuccess={() => {
            // Recharger la page pour voir les nouveaux stocks
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
