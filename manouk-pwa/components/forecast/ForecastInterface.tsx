'use client'

import { useState, useMemo } from 'react'
import ForecastResults from './ForecastResults'

// Type pour les quantités : { productId: { monthKey: quantity } }
type MonthlyQuantities = {
  [productId: string]: {
    [monthKey: string]: number
  }
}

export default function ForecastInterface({ products, rawMaterials, fixedCosts, companies, productSplits }: any) {
  console.log('🔧 [ForecastInterface] Received props:', { 
    productsCount: products?.length, 
    rawMaterialsCount: rawMaterials?.length,
    companiesCount: companies?.length,
    productSplitsCount: productSplits?.length,
    productSplits 
  })
  
  const [monthlyQty, setMonthlyQty] = useState<MonthlyQuantities>({})
  const [showResults, setShowResults] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [productToAdd, setProductToAdd] = useState<string>('')

  // Générer 6 mois à partir d'aujourd'hui
  const months = useMemo(() => {
    const result = []
    const today = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
      result.push({
        label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      })
    }
    return result
  }, [])

  // Produits disponibles (non encore ajoutés)
  const availableProducts = useMemo(() => {
    return products.filter((p: any) => !selectedProducts.includes(p.id))
  }, [products, selectedProducts])

  // Ajouter un produit à la simulation
  const addProduct = () => {
    if (productToAdd && !selectedProducts.includes(productToAdd)) {
      setSelectedProducts([...selectedProducts, productToAdd])
      setProductToAdd('')
    }
  }

  // Retirer un produit de la simulation
  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(id => id !== productId))
    // Supprimer les quantités associées
    const newQty = { ...monthlyQty }
    delete newQty[productId]
    setMonthlyQty(newQty)
  }

  // Mettre à jour une quantité pour un produit × mois
  const updateQty = (productId: string, monthKey: string, qty: number) => {
    setMonthlyQty(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [monthKey]: qty
      }
    }))
  }

  const calculateSimulation = () => {
    setShowResults(true)
  }

  const resetSimulation = () => {
    setMonthlyQty({})
    setShowResults(false)
    setSelectedProducts([])
  }

  // Filtrer les produits affichés
  const displayedProducts = products.filter((p: any) => selectedProducts.includes(p.id))

  return (
    <div className="space-y-8">
      {/* FORMULAIRE DE SAISIE (une seule fois) */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Simulation de ventes (6 prochains mois)</h2>
        
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun produit défini. Créez vos produits dans les Paramètres.</p>
        ) : (
          <>
            {/* Sélecteur de produit */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ➕ Ajouter un produit à la simulation
              </label>
              <div className="flex gap-3">
                <select
                  value={productToAdd}
                  onChange={(e) => setProductToAdd(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Choisir un produit --</option>
                  {availableProducts.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.price)})
                    </option>
                  ))}
                </select>
                <button
                  onClick={addProduct}
                  disabled={!productToAdd}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  ✓ Ajouter
                </button>
              </div>
            </div>

            {/* Liste des produits sélectionnés */}
            {selectedProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                👆 Sélectionnez un produit ci-dessus pour commencer la simulation
              </p>
            ) : (
              <div className="space-y-4">
                {displayedProducts.map((product: any) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold text-sm px-2 py-1 hover:bg-red-100 rounded"
                      title="Retirer ce produit"
                    >
                      ✕ Retirer
                    </button>
                    <div className="font-semibold text-gray-900 mb-3">
                      {product.name} <span className="text-sm font-normal text-gray-600">({new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.price)} / unité)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {months.map(month => (
                        <div key={month.key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {month.label}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={monthlyQty[product.id]?.[month.key] || ''}
                            onChange={(e) => updateQty(product.id, month.key, Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Qté"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex gap-4">
              <button
                onClick={calculateSimulation}
                disabled={selectedProducts.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                📊 Calculer le prévisionnel
              </button>
              {showResults && (
                <button
                  onClick={resetSimulation}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                >
                  🔄 Réinitialiser
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* RÉSULTATS (affichés plusieurs fois) */}
      {showResults && (
        <>
          {/* Prévisionnel GLOBAL */}
          <div className="border-4 border-indigo-200 rounded-xl p-6 bg-indigo-50">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">📊 Prévisionnel GLOBAL (toutes sociétés)</h2>
            <ForecastResults
              monthlyQty={monthlyQty}
              months={months}
              products={products}
              rawMaterials={rawMaterials}
              fixedCosts={fixedCosts}
              companyId={null}
              productSplits={productSplits}
            />
          </div>

          {/* Prévisionnel PAR SOCIÉTÉ */}
          {companies.map((company: any) => (
            <div key={company.id} className="border-4 border-green-200 rounded-xl p-6 bg-green-50">
              <h2 className="text-2xl font-bold text-green-900 mb-4">🏢 Prévisionnel {company.name}</h2>
              <ForecastResults
                monthlyQty={monthlyQty}
                months={months}
                products={products}
                rawMaterials={rawMaterials}
                fixedCosts={fixedCosts}
                companyId={company.id}
                productSplits={productSplits}
              />
            </div>
          ))}
        </>
      )}
    </div>
  )
}
