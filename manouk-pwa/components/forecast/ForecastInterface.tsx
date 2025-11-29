'use client'

import { useState, useRef, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function ForecastInterface({ products, rawMaterials }: any) {
  const [results, setResults] = useState<any>(null)

  // Générer 6 mois futurs
  const generateMonths = () => {
    const months = []
    const today = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
      months.push({
        label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      })
    }
    return months
  }

  const months = generateMonths()

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const calculateForecast = () => {
    if (products.length === 0) {
      alert('Aucun produit disponible pour la simulation')
      return
    }

    // Collecter les inputs
    const inputs = document.querySelectorAll('.forecast-qty-input') as NodeListOf<HTMLInputElement>
    const salesByMonth: any = {}

    inputs.forEach(input => {
      const productId = input.dataset.productId
      const month = input.dataset.month
      const qty = parseFloat(input.value || '0')

      if (qty > 0) {
        if (!salesByMonth[month!]) salesByMonth[month!] = {}
        salesByMonth[month!][productId!] = qty
      }
    })

    if (Object.keys(salesByMonth).length === 0) {
      alert('Aucune vente saisie. Entrez des quantités pour simuler.')
      return
    }

    // Calculer pour chaque mois
    const monthKeys = Object.keys(salesByMonth).sort()
    const simulationResults = []
    let cumulativeBalance = 0
    let totalRevenue = 0
    let totalExpenses = 0

    monthKeys.forEach(month => {
      const sales = salesByMonth[month]
      let revenue = 0
      let materialCost = 0
      let totalUnits = 0

      // Calcul CA et coûts matières
      Object.keys(sales).forEach(productId => {
        const qty = sales[productId]
        const product = products.find((p: any) => p.id === productId)

        if (product) {
          revenue += product.price * qty
          totalUnits += qty

          // Calculer coût matières via BOM
          const bom = product.product_materials || []
          bom.forEach((bomItem: any) => {
            if (bomItem.raw_material) {
              materialCost += bomItem.raw_material.unit_cost * bomItem.quantity * qty
            }
          })
        }
      })

      // URSSAF 22% du CA
      const urssaf = revenue * 0.22
      const totalExpense = materialCost + urssaf
      const netResult = revenue - totalExpense
      cumulativeBalance += netResult

      totalRevenue += revenue
      totalExpenses += totalExpense

      simulationResults.push({
        month,
        units: totalUnits,
        revenue,
        materialCost,
        urssaf,
        totalExpense,
        netResult,
        balance: cumulativeBalance
      })
    })

    setResults({
      months: simulationResults,
      totalRevenue,
      totalExpenses,
      netResult: totalRevenue - totalExpenses,
      finalBalance: cumulativeBalance
    })
  }

  const resetForecast = () => {
    const inputs = document.querySelectorAll('.forecast-qty-input') as NodeListOf<HTMLInputElement>
    inputs.forEach(input => input.value = '0')
    setResults(null)
  }

  // Chart data
  const chartData = results ? {
    labels: results.months.map((r: any) => {
      const d = new Date(r.month + '-01')
      return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    }),
    datasets: [
      {
        label: 'CA (€)',
        data: results.months.map((r: any) => r.revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      },
      {
        label: 'Dépenses (€)',
        data: results.months.map((r: any) => r.totalExpense),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      },
      {
        label: 'Solde cumulé (€)',
        data: results.months.map((r: any) => r.balance),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: true
      }
    ]
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { size: 13, weight: '600' as any },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as any },
        bodyFont: { size: 13 },
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
          },
          font: { size: 11 }
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        ticks: { font: { size: 11, weight: '600' as any } },
        grid: { display: false }
      }
    }
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <p className="text-gray-500">Aucun produit configuré. Ajoutez des produits dans Paramètres → Produits.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Inputs par produit × mois */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Simulation de ventes (6 prochains mois)</h3>
        <div className="space-y-4">
          {products.map((product: any) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="font-semibold text-gray-900 mb-3">
                {product.name} <span className="text-sm font-normal text-gray-600">({formatEuro(product.price)} / unité)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {months.map(month => (
                  <div key={month.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {month.label}
                    </label>
                    <input
                      type="number"
                      data-product-id={product.id}
                      data-month={month.key}
                      className="forecast-qty-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="0"
                      step="1"
                      defaultValue="0"
                      placeholder="Qté"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={calculateForecast}
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            🔮 Calculer la simulation
          </button>
          <button
            onClick={resetForecast}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
          >
            🔄 Réinitialiser
          </button>
        </div>
      </div>

      {/* Résultats */}
      {results && (
        <>
          {/* Graphique */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Résultat de la simulation</h3>
            <div className="h-80">
              <Line data={chartData!} options={chartOptions} />
            </div>
          </div>

          {/* Tableau détaillé */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Détail mensuel</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
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
                  {results.months.map((r: any) => {
                    const monthLabel = new Date(r.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                    return (
                      <tr key={r.month} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-sm text-gray-900">{monthLabel}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">{r.units}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">{formatEuro(r.revenue)}</td>
                        <td className="px-4 py-3 text-right text-sm text-red-600">{formatEuro(r.materialCost)}</td>
                        <td className="px-4 py-3 text-right text-sm text-orange-600">{formatEuro(r.urssaf)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">{formatEuro(r.totalExpense)}</td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${r.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatEuro(r.netResult)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${r.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatEuro(r.balance)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600 rounded-lg p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">CA prévisionnel total</div>
              <div className="text-2xl font-bold text-green-700">{formatEuro(results.totalRevenue)}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-600 rounded-lg p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Dépenses totales</div>
              <div className="text-2xl font-bold text-red-700">{formatEuro(results.totalExpenses)}</div>
            </div>
            <div className={`bg-gradient-to-br ${results.netResult >= 0 ? 'from-blue-50 to-blue-100 border-blue-600' : 'from-gray-50 to-gray-100 border-gray-600'} border-l-4 rounded-lg p-6`}>
              <div className="text-sm font-medium text-gray-600 mb-1">Résultat net prévisionnel</div>
              <div className={`text-2xl font-bold ${results.netResult >= 0 ? 'text-blue-700' : 'text-gray-700'}`}>
                {formatEuro(results.netResult)}
              </div>
            </div>
            <div className={`bg-gradient-to-br ${results.finalBalance >= 0 ? 'from-indigo-50 to-indigo-100 border-indigo-600' : 'from-orange-50 to-orange-100 border-orange-600'} border-l-4 rounded-lg p-6`}>
              <div className="text-sm font-medium text-gray-600 mb-1">Solde final</div>
              <div className={`text-2xl font-bold ${results.finalBalance >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
                {formatEuro(results.finalBalance)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
