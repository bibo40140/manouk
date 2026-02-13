'use client'

import { useState } from 'react'
import { BellIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

type StockAlert = {
  id: string
  item_name: string
  item_type: 'raw_material' | 'product'
  current_stock: number
  alert_threshold: number
  email_sent: boolean
  email_sent_date: string | null
  created_at: string
  company: {
    name: string
    email: string
  }
}

type Props = {
  alerts: StockAlert[]
}

export default function StockAlerts({ alerts }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)

  const pendingAlerts = alerts.filter(a => !a.email_sent)
  const sentAlerts = alerts.filter(a => a.email_sent)

  const handleSendAlerts = async () => {
    if (!confirm(`Envoyer ${pendingAlerts.length} alerte(s) par email ?`)) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/stock/process-alerts', {
        method: 'POST',
      })

      const data = await response.json()
      
      if (data.sent !== undefined) {
        setResult({ sent: data.sent, total: data.total || pendingAlerts.length })
      }

      // Rafraîchir la page après 2 secondes pour voir les alertes mises à jour
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Erreur envoi alertes:', error)
      alert('Erreur lors de l\'envoi des alertes')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alertes de Stock</h2>
          <p className="text-gray-600 mt-1">
            Gestion des notifications automatiques de stock bas
          </p>
        </div>

        {pendingAlerts.length > 0 && (
          <button
            onClick={handleSendAlerts}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <EnvelopeIcon className="w-5 h-5" />
            {loading ? 'Envoi en cours...' : `Envoyer ${pendingAlerts.length} alerte(s)`}
          </button>
        )}
      </div>

      {/* Résultat de l'envoi */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Envoi réussi</h3>
            <p className="text-green-700 text-sm">
              {result.sent} alerte(s) envoyée(s) sur {result.total}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <BellIcon className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{pendingAlerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Envoyées</p>
              <p className="text-2xl font-bold text-gray-900">{sentAlerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes en attente */}
      {pendingAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              ⏳ Alertes en attente d'envoi
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock actuel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Seuil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Société
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Créée le
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {alert.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        alert.item_type === 'raw_material' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.item_type === 'raw_material' ? 'Matière première' : 'Produit fini'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-red-600 font-semibold">
                        {alert.current_stock.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {alert.alert_threshold.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {alert.company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                      {alert.company.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {formatDate(alert.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alertes envoyées */}
      {sentAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              ✅ Alertes envoyées
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Société
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Envoyé le
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sentAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {alert.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        alert.item_type === 'raw_material' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.item_type === 'raw_material' ? 'Matière première' : 'Produit fini'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {alert.current_stock.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {alert.company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {alert.email_sent_date ? formatDate(alert.email_sent_date) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aucune alerte */}
      {alerts.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune alerte de stock
          </h3>
          <p className="text-gray-600">
            Les alertes apparaîtront ici lorsqu'une matière première atteindra son seuil d'alerte.
          </p>
        </div>
      )}
    </div>
  )
}
