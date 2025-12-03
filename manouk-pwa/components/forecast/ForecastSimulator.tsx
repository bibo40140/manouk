'use client'

import { useState, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Type pour les quantités : { productId: { monthKey: quantity } }
type MonthlyQuantities = {
  [productId: string]: {
    [monthKey: string]: number
  }
}

export default function ForecastSimulator({ products, rawMaterials, splits, companies, purchases }: any) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [monthlyQty, setMonthlyQty] = useState<MonthlyQuantities>({})
  const [showResults, setShowResults] = useState(false)

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

  // Calculer la simulation
  const calculateSimulation = () => {
    setShowResults(true)
  }

  const resetSimulation = () => {
    setMonthlyQty({})
    setShowResults(false)
    setSelectedProducts([])
  }

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const selectAllProducts = () => {
    setSelectedProducts(products.map((p: any) => p.id))
  }

  const deselectAllProducts = () => {
    setSelectedProducts([])
  }

  // Filtrer les produits sélectionnés
  const displayedProducts = products.filter((p: any) => selectedProducts.includes(p.id))

  // Calculer les résultats mensuels par société
  const simulation = useMemo(() => {
    if (!showResults) return null

    // Regrouper les splits par produit (éviter les doublons)
    const splitsByProduct: any = {}
    const seenSplits = new Set<string>()
    
    splits.forEach((split: any) => {
      const key = `${split.product_id}-${split.company_id}`
      if (!seenSplits.has(key)) {
        seenSplits.add(key)
        if (!splitsByProduct[split.product_id]) {
          splitsByProduct[split.product_id] = []
        }
        splitsByProduct[split.product_id].push(split)
      }
    })

    console.log('Splits par produit:', splitsByProduct)

    const results = months.map(month => {
      // Résultats globaux
      let totalUnits = 0
      let totalRevenue = 0
      let totalMaterialCosts = 0

      // Résultats par société
      const byCompany: any = {}
      companies.forEach((company: any) => {
        byCompany[company.id] = {
          companyName: company.name,
          revenue: 0,
          materialCosts: 0,
          urssaf: 0,
          totalExpense: 0,
          netResult: 0
        }
      })

      // Pour chaque produit sélectionné
      displayedProducts.forEach((product: any) => {
        const qty = monthlyQty[product.id]?.[month.key] || 0
        if (qty > 0) {
          totalUnits += qty

          // Calculer le coût matières total pour ce produit
          let productMaterialCost = 0
          if (product.product_materials) {
            product.product_materials.forEach((pm: any) => {
              const material = rawMaterials.find((m: any) => m.id === pm.raw_material_id)
              if (material) {
                productMaterialCost += material.unit_cost * pm.quantity * qty
              }
            })
          }
          totalMaterialCosts += productMaterialCost

          // Vérifier s'il y a des splits pour ce produit
          const productSplits = splitsByProduct[product.id] || []
          
          if (productSplits.length > 0) {
            // Calculer le CA total du produit (somme des splits)
            const totalProductRevenue = productSplits.reduce((sum: number, split: any) => sum + split.amount, 0) * qty
            totalRevenue += totalProductRevenue

            // Répartir le CA et les coûts entre les sociétés selon les splits
            productSplits.forEach((split: any) => {
              const companyRevenue = split.amount * qty
              const revenueRatio = companyRevenue / totalProductRevenue
              const companyMaterialCost = productMaterialCost * revenueRatio

              if (byCompany[split.company_id]) {
                byCompany[split.company_id].revenue += companyRevenue
                byCompany[split.company_id].materialCosts += companyMaterialCost
              }
            })
          } else {
            // Si pas de split, tout va à la société du produit
            const companyRevenue = product.price * qty
            totalRevenue += companyRevenue
            
            if (byCompany[product.company_id]) {
              byCompany[product.company_id].revenue += companyRevenue
              byCompany[product.company_id].materialCosts += productMaterialCost
            }
          }
        }
      })

      // Calculer URSSAF et totaux par société
      Object.keys(byCompany).forEach(companyId => {
        const company = byCompany[companyId]
        company.urssaf = company.revenue * 0.22
        company.totalExpense = company.materialCosts + company.urssaf
        company.netResult = company.revenue - company.totalExpense
      })

      // Totaux globaux
      const totalUrssaf = totalRevenue * 0.22
      const totalExpense = totalMaterialCosts + totalUrssaf
      const netResult = totalRevenue - totalExpense

      return {
        month: month.label,
        units: totalUnits,
        revenue: totalRevenue,
        materialCosts: totalMaterialCosts,
        urssaf: totalUrssaf,
        totalExpense,
        netResult,
        byCompany: Object.values(byCompany)
      }
    })

    // Calculer solde cumulé global
    let cumulativeBalance = 0
    const resultsWithBalance = results.map(r => {
      cumulativeBalance += r.netResult
      return { ...r, balance: cumulativeBalance }
    })

    // Calculer solde cumulé par société
    const companyBalances: any = {}
    companies.forEach((c: any) => { companyBalances[c.name] = 0 })
    
    resultsWithBalance.forEach(result => {
      result.byCompany.forEach((company: any) => {
        companyBalances[company.companyName] += company.netResult
        company.balance = companyBalances[company.companyName]
      })
    })

    return resultsWithBalance
  }, [showResults, monthlyQty, displayedProducts, rawMaterials, months, splits, companies])

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  // Données du graphique
  const chartData = simulation ? {
    labels: simulation.map(m => m.month),
    datasets: [
      {
        label: 'CA (€)',
        data: simulation.map(m => m.revenue),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Coûts matières (€)',
        data: simulation.map(m => m.materialCosts),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'URSSAF (22%)',
        data: simulation.map(m => m.urssaf),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Solde cumulé (€)',
        data: simulation.map(m => m.balance),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
      },
    ],
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.dataset.label + ': ' + formatEuro(context.parsed.y)
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatEuro(value)
          }
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Simulez vos ventes futures pour anticiper votre trésorerie. Les coûts matières et l'URSSAF sont calculés automatiquement.
      </p>

      {/* Sélection des produits */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🛍️ Sélection des produits</h3>
        
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucun produit configuré. Ajoutez des produits dans Paramètres → Produits.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3 mb-4">
              <button
                onClick={selectAllProducts}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ✓ Tout sélectionner
              </button>
              <button
                onClick={deselectAllProducts}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ✗ Tout désélectionner
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((product: any) => (
                <label
                  key={product.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedProducts.includes(product.id)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{formatEuro(product.price || 0)} / unité</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grille d'inputs par produit × mois */}
      {selectedProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Simulation de ventes (6 prochains mois)</h3>
          
          <div className="space-y-8">
            {displayedProducts.map((product: any) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="font-semibold text-gray-900 mb-3">
                  {product.name} ({formatEuro(product.price || 0)} / unité)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {months.map(month => (
                    <div key={month.key}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {month.label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={monthlyQty[product.id]?.[month.key] || 0}
                        onChange={(e) => updateQty(product.id, month.key, parseInt(e.target.value) || 0)}
                        placeholder="Qté"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={calculateSimulation}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              🔮 Calculer la simulation
            </button>
            <button
              onClick={resetSimulation}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              🔄 Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* Résultats */}
      {simulation && (
        <>
          {/* Graphique */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Résultat de la simulation</h2>
            <div className="h-80">
              {chartData && <Line data={chartData} options={chartOptions} />}
            </div>
          </div>

          {/* Résultats par société */}
          {companies.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🏢 Résultats par société</h2>
              <div className="space-y-6">
                {companies.map((company: any) => {
                  // Calculer les totaux pour cette société
                  const companyData = simulation.map(month => 
                    month.byCompany.find((c: any) => c.companyName === company.name) || {
                      revenue: 0, materialCosts: 0, urssaf: 0, totalExpense: 0, netResult: 0, balance: 0
                    }
                  )
                  
                  const totalRevenue = companyData.reduce((sum, m) => sum + m.revenue, 0)
                  const totalExpense = companyData.reduce((sum, m) => sum + m.totalExpense, 0)
                  const totalResult = companyData.reduce((sum, m) => sum + m.netResult, 0)
                  const finalBalance = companyData[companyData.length - 1]?.balance || 0

                  // Ne pas afficher la société si elle n'a aucun CA
                  if (totalRevenue === 0) return null

                  return (
                    <div key={company.id} className="border-2 border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{company.name}</h3>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="text-xs text-gray-600">CA Total</div>
                          <div className="text-lg font-bold text-green-600">{formatEuro(totalRevenue)}</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="text-xs text-gray-600">Dépenses</div>
                          <div className="text-lg font-bold text-red-600">{formatEuro(totalExpense)}</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-xs text-gray-600">Résultat</div>
                          <div className={`text-lg font-bold ${totalResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatEuro(totalResult)}
                          </div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="text-xs text-gray-600">Solde final</div>
                          <div className={`text-lg font-bold ${finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatEuro(finalBalance)}
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Mois</th>
                              <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600">CA (€)</th>
                              <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600">Matières (€)</th>
                              <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600">URSSAF (€)</th>
                              <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600">Résultat (€)</th>
                              <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600">Solde (€)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {companyData.map((data, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-2 py-2 text-gray-900 capitalize">{simulation[idx].month}</td>
                                <td className="px-2 py-2 text-right text-green-600">{formatEuro(data.revenue)}</td>
                                <td className="px-2 py-2 text-right text-red-600">{formatEuro(data.materialCosts)}</td>
                                <td className="px-2 py-2 text-right text-orange-600">{formatEuro(data.urssaf)}</td>
                                <td className={`px-2 py-2 text-right font-medium ${
                                  data.netResult >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatEuro(data.netResult)}
                                </td>
                                <td className={`px-2 py-2 text-right font-bold ${
                                  data.balance >= 0 ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {formatEuro(data.balance)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tableau détaillé global */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Résumé global par mois</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Mois</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Ventes (unités)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">CA (€)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Coût matières (€)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">URSSAF (22%)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total dépenses (€)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Résultat (€)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Solde cumulé (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {simulation.map((month, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                        {month.month}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {month.units}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                        {formatEuro(month.revenue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {formatEuro(month.materialCosts)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-orange-600">
                        {formatEuro(month.urssaf)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {formatEuro(month.totalExpense)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                        month.netResult >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatEuro(month.netResult)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${
                        month.balance >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatEuro(month.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-700">
                      {simulation.reduce((sum, m) => sum + m.units, 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                      {formatEuro(simulation.reduce((sum, m) => sum + m.revenue, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                      {formatEuro(simulation.reduce((sum, m) => sum + m.materialCosts, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">
                      {formatEuro(simulation.reduce((sum, m) => sum + m.urssaf, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                      {formatEuro(simulation.reduce((sum, m) => sum + m.totalExpense, 0))}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-bold ${
                      simulation.reduce((sum, m) => sum + m.netResult, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatEuro(simulation.reduce((sum, m) => sum + m.netResult, 0))}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-bold ${
                      simulation[simulation.length - 1].balance >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formatEuro(simulation[simulation.length - 1].balance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Stats globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md border-l-4 border-green-600 p-4 hover:shadow-lg transition-shadow">
              <div className="text-sm font-medium text-gray-600">CA prévisionnel total</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {formatEuro(simulation.reduce((sum, m) => sum + m.revenue, 0))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md border-l-4 border-red-600 p-4 hover:shadow-lg transition-shadow">
              <div className="text-sm font-medium text-gray-600">Dépenses totales</div>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {formatEuro(simulation.reduce((sum, m) => sum + m.totalExpense, 0))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-600 p-4 hover:shadow-lg transition-shadow">
              <div className="text-sm font-medium text-gray-600">Résultat net prévisionnel</div>
              <div className={`text-2xl font-bold mt-1 ${
                simulation.reduce((sum, m) => sum + m.netResult, 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatEuro(simulation.reduce((sum, m) => sum + m.netResult, 0))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md border-l-4 border-orange-600 p-4 hover:shadow-lg transition-shadow">
              <div className="text-sm font-medium text-gray-600">Solde final</div>
              <div className={`text-2xl font-bold mt-1 ${
                simulation[simulation.length - 1].balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatEuro(simulation[simulation.length - 1].balance)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
