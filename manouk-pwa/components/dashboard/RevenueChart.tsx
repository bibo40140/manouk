'use client'

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

export default function RevenueChart({ companyId }: { companyId?: string }) {
  // TODO: Récupérer les vraies données depuis Supabase
  // Pour l'instant, données de démonstration
  const data = {
    labels: ['Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre'],
    datasets: [
      {
        label: 'Chiffre d\'affaires',
        data: [1200, 1900, 1500, 2200, 1800, 2400],
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
