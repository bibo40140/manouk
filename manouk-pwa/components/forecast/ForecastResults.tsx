'use client'

import { useMemo } from 'react'
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function ForecastResults({ monthlyQty, months, products, rawMaterials, fixedCosts, companyId, productSplits }: any) {
  console.log('🔍 [ForecastResults] Init:', { 
    companyId, 
    productsCount: products?.length,
    productSplitsCount: productSplits?.length,
    productSplits: productSplits
  })
  
  // Filtrer les données par société si un filtre est actif
  const filteredRawMaterials = useMemo(() => {
    return companyId && companyId !== 'all' 
      ? (rawMaterials || []).filter((rm: any) => rm.company_id === companyId)
      : rawMaterials || []
  }, [companyId, rawMaterials])
  
  // Obtenir le montant d'un produit pour la société sélectionnée
  const getProductAmountForCompany = (productId: string): number => {
    if (companyId && companyId !== 'all') {
      // Trouver le split pour cette société
      const split = (productSplits || []).find((s: any) => s.product_id === productId && s.company_id === companyId)
      console.log(`📊 [ForecastResults] Product ${productId} | Company ${companyId} | Split:`, split, '| Amount:', split ? Number(split.amount) : 0)
      return split ? Number(split.amount) : 0
    } else {
      // Si "Tout", retourner le prix total
      const product = products.find((p: any) => p.id === productId)
      console.log(`📊 [ForecastResults] Product ${productId} | Company ALL | Price:`, product ? Number(product.price) : 0)
      return product ? Number(product.price) : 0
    }
  }
    
  const filteredFixedCosts = useMemo(() => {
    return companyId && companyId !== 'all'
      ? (fixedCosts || []).filter((fc: any) => fc.company_id === companyId)
      : fixedCosts || []
  }, [companyId, fixedCosts])

  // Calculer le total des frais fixes mensuels
  const getMonthlyAmount = (amount: number, frequency: string) => {
    switch(frequency) {
      case 'yearly': return amount / 12
      case 'quarterly': return amount / 3
      default: return amount
    }
  }

  const fixedCostsMonthly = useMemo(() => {
    return filteredFixedCosts.reduce((sum: number, cost: any) => 
      sum + getMonthlyAmount(Number(cost.amount), cost.frequency), 0)
  }, [filteredFixedCosts])

  // Calculer les résultats mensuels
  const simulation = useMemo(() => {
    const results = months.map((month: any) => {
      let totalUnits = 0
      let revenue = 0
      let materialCosts = 0

      // Pour chaque produit
      products.forEach((product: any) => {
        const qty = monthlyQty[product.id]?.[month.key] || 0
        if (qty > 0) {
          totalUnits += qty
          revenue += getProductAmountForCompany(product.id) * qty

          // Calculer coût matières via BOM
          if (product.product_materials) {
            product.product_materials.forEach((pm: any) => {
              const material = filteredRawMaterials.find((m: any) => m.id === pm.raw_material_id)
              if (material) {
                materialCosts += material.unit_cost * pm.quantity * qty
              }
            })
          }
        }
      })

      // URSSAF 22% du CA
      const urssaf = revenue * 0.22
      const totalExpense = materialCosts + urssaf + fixedCostsMonthly
      const netResult = revenue - totalExpense

      return {
        month: month.label,
        units: totalUnits,
        revenue,
        materialCosts,
        fixedCosts: fixedCostsMonthly,
        urssaf,
        totalExpense,
        netResult
      }
    })

    // Calculer solde cumulé
    let cumulativeBalance = 0
    return results.map((r: any) => {
      cumulativeBalance += r.netResult
      return { ...r, balance: cumulativeBalance }
    })
  }, [monthlyQty, products, filteredRawMaterials, filteredFixedCosts, fixedCostsMonthly, months])

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  // Données du graphique
  const chartData = {
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
  }

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
      {filteredFixedCosts.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-lg">💡</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Frais fixes mensuels :</strong> {formatEuro(fixedCostsMonthly)} 
                {` (${filteredFixedCosts.map((c: any) => c.name).join(', ')})`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tableau résultats */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">Mois</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 border-b">Unités</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 border-b">CA</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 border-b">Matières</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 border-b">Frais fixes</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 border-b">URSSAF</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 border-b">Total dépenses</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 border-b">Résultat</th>
              <th className="px-3 py-2 text-right font-semibold text-blue-700 border-b">Solde cumulé</th>
            </tr>
          </thead>
          <tbody>
            {simulation.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2 border-b">{row.month}</td>
                <td className="px-3 py-2 text-right border-b">{row.units}</td>
                <td className="px-3 py-2 text-right border-b text-green-600 font-medium">{formatEuro(row.revenue)}</td>
                <td className="px-3 py-2 text-right border-b text-red-600">{formatEuro(row.materialCosts)}</td>
                <td className="px-3 py-2 text-right border-b text-purple-600">{formatEuro(row.fixedCosts)}</td>
                <td className="px-3 py-2 text-right border-b text-orange-600">{formatEuro(row.urssaf)}</td>
                <td className="px-3 py-2 text-right border-b text-gray-700">{formatEuro(row.totalExpense)}</td>
                <td className={`px-3 py-2 text-right border-b font-semibold ${row.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatEuro(row.netResult)}
                </td>
                <td className={`px-3 py-2 text-right border-b font-bold ${row.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatEuro(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-xl shadow-md p-6" style={{ height: '400px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}
