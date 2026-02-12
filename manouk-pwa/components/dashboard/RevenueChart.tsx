'use client'

import { Line } from 'react-chartjs-2'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

export default function RevenueChart({ companyId }: { companyId?: string }) {
  const [chartData, setChartData] = useState<{
    caReel: number[]
    caPrevisionnel: number[]
    resultatReel: number[]
    resultatFictif: number[]
  }>({
    caReel: [],
    caPrevisionnel: [],
    resultatReel: [],
    resultatFictif: []
  })
  const [labels, setLabels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRevenueData() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Calculer les 6 derniers mois
        const months = []
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          months.push({
            start: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
            end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString(),
            label: monthNames[date.getMonth()],
            monthIndex: date.getMonth(),
            year: date.getFullYear()
          })
        }

        // Optimisation : Récupérer toutes les données en 3 requêtes au lieu de 24
        const startDate = months[0].start
        const endDate = months[5].end

        // 1. Toutes les factures
        let invoicesQuery = supabase
          .from('invoices')
          .select('date, total, paid, company_id')
          .gte('date', startDate)
          .lte('date', endDate)

        if (companyId && companyId !== 'all') {
          invoicesQuery = invoicesQuery.eq('company_id', companyId)
        }

        const { data: invoices } = await invoicesQuery

        // 2. Tous les achats
        let purchasesQuery = supabase
          .from('purchases')
          .select('date, amount, paid, company_id')
          .gte('date', startDate)
          .lte('date', endDate)

        if (companyId && companyId !== 'all') {
          purchasesQuery = purchasesQuery.eq('company_id', companyId)
        }

        const { data: purchases } = await purchasesQuery

        // 3. Coûts fixes
        let fixedCostsQuery = supabase
          .from('fixed_costs')
          .select('amount, frequency, company_id')

        if (companyId && companyId !== 'all') {
          fixedCostsQuery = fixedCostsQuery.eq('company_id', companyId)
        }

        const { data: fixedCosts } = await fixedCostsQuery

        // Calculer les coûts fixes mensuels
        const monthlyFixedCosts = fixedCosts?.reduce((sum, cost) => {
          let monthlyAmount = cost.amount || 0
          if (cost.frequency === 'quarterly') monthlyAmount = monthlyAmount / 3
          if (cost.frequency === 'yearly') monthlyAmount = monthlyAmount / 12
          return sum + monthlyAmount
        }, 0) || 0

        // Traiter les données par mois
        const dataByMonth = months.map((month) => {
          const monthInvoices = invoices?.filter(inv => {
            const invDate = new Date(inv.date)
            return invDate >= new Date(month.start) && invDate <= new Date(month.end)
          }) || []

          const monthPurchases = purchases?.filter(p => {
            const pDate = new Date(p.date)
            return pDate >= new Date(month.start) && pDate <= new Date(month.end)
          }) || []

          const caReel = monthInvoices
            .filter(inv => inv.paid)
            .reduce((sum, inv) => sum + (inv.total || 0), 0)

          const caPrevisionnel = monthInvoices
            .reduce((sum, inv) => sum + (inv.total || 0), 0)

          const achatsPayes = monthPurchases
            .filter(p => p.paid)
            .reduce((sum, p) => sum + (p.amount || 0), 0)

          const achatsPrevisionnel = monthPurchases
            .reduce((sum, p) => sum + (p.amount || 0), 0)

          return {
            caReel,
            caPrevisionnel,
            resultatReel: caReel - achatsPayes - monthlyFixedCosts,
            resultatFictif: caPrevisionnel - achatsPrevisionnel - monthlyFixedCosts
          }
        })

        setLabels(months.map(m => m.label))
        setChartData({
          caReel: dataByMonth.map(d => d.caReel),
          caPrevisionnel: dataByMonth.map(d => d.caPrevisionnel),
          resultatReel: dataByMonth.map(d => d.resultatReel),
          resultatFictif: dataByMonth.map(d => d.resultatFictif)
        })
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [companyId])

  const data = {
    labels,
    datasets: [
      {
        label: 'CA Réel (payé)',
        data: chartData.caReel,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'CA Prévisionnel',
        data: chartData.caPrevisionnel,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: false,
        tension: 0.4,
        borderDash: [5, 5],
      },
      {
        label: 'Résultat Réel',
        data: chartData.resultatReel,
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Résultat Fictif',
        data: chartData.resultatFictif,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.4,
        borderDash: [5, 5],
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        onClick: (e: any, legendItem: any, legend: any) => {
          const index = legendItem.datasetIndex
          const chart = legend.chart
          const meta = chart.getDatasetMeta(index)
          
          meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null
          chart.update()
        },
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          },
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets
            return datasets.map((dataset: any, i: number) => ({
              text: dataset.label,
              fillStyle: dataset.borderColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i
            }))
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.dataset.label + ': ' + context.parsed.y.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString('fr-FR') + ' €'
          }
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Évolution financière (6 derniers mois)
        </h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 Évolution financière (6 derniers mois)
      </h3>
      <div className="text-xs text-gray-500 mb-2">
        💡 Cliquez sur les légendes pour masquer/afficher les courbes
      </div>
      <div className="h-80">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
