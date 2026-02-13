'use client'

import { useState, useMemo } from 'react'
import ProductionButton from '@/components/dashboard/ProductionButton'

export default function ProductionsHistory({ productions: initialProductions, products }: any) {
  const [filterProduct, setFilterProduct] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>('all')

  // Extraire les mois disponibles
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    initialProductions.forEach((p: any) => {
      const date = new Date(p.production_date)
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    })
    return Array.from(months).sort().reverse()
  }, [initialProductions])

  // Filtrer les productions
  const filteredProductions = useMemo(() => {
    return initialProductions.filter((p: any) => {
      const productMatch = filterProduct === 'all' || p.product_id === filterProduct
      
      let monthMatch = true
      if (filterMonth !== 'all') {
        const date = new Date(p.production_date)
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthMatch = monthStr === filterMonth
      }
      
      return productMatch && monthMatch
    })
  }, [initialProductions, filterProduct, filterMonth])

  // Calculer les stats
  const stats = useMemo(() => {
    const totalQuantity = filteredProductions.reduce((sum: number, p: any) => sum + parseFloat(p.quantity), 0)
    const uniqueProducts = new Set(filteredProductions.map((p: any) => p.product_id)).size
    
    return {
      totalProductions: filteredProductions.length,
      totalQuantity,
      uniqueProducts
    }
  }, [filteredProductions])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Bouton Nouvelle Production */}
      <div className="flex justify-end">
        <ProductionButton products={products} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Total Productions</div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalProductions}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Unités Produites</div>
          <div className="text-2xl font-bold text-green-900">{stats.totalQuantity}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 font-medium">Produits Différents</div>
          <div className="text-2xl font-bold text-purple-900">{stats.uniqueProducts}</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par produit
            </label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">Tous les produits</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par mois
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">Tous les mois</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {getMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProductions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Aucune production trouvée
                  </td>
                </tr>
              ) : (
                filteredProductions.map((production: any) => (
                  <tr key={production.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(production.production_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {production.product?.name || 'Produit inconnu'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        +{production.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {production.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProductions.length > 0 && (
        <div className="text-sm text-gray-500 text-right">
          {filteredProductions.length} production{filteredProductions.length > 1 ? 's' : ''} affichée{filteredProductions.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
