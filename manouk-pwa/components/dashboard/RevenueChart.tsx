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
  const [chartData, setChartData] = useState<number[]>([])
  const [labels, setLabels] = useState<string[]>([])

  useEffect(() => {
    async function fetchRevenueData() {
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
          label: monthNames[date.getMonth()]
        })
      }

      // Récupérer le CA pour chaque mois
      const revenues = await Promise.all(
        months.map(async (month) => {
          let query = supabase
            .from('invoices')
            .select('total')
            .gte('invoice_date', month.start)
            .lte('invoice_date', month.end)

          if (companyId && companyId !== 'all') {
            query = query.eq('company_id', companyId)
          }

          const { data } = await query
          return data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
        })
      )

      setLabels(months.map(m => m.label))
      setChartData(revenues)
    }

    fetchRevenueData()
  }, [companyId])

  const data = {
    labels,
    datasets: [
      {
        label: 'Chiffre d\'affaires',
        data: chartData,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.parsed.y.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
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

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 Évolution du CA (6 derniers mois)
      </h3>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
