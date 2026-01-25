'use client'

export default function RawMaterialsStock({ materials }: { materials: any[] }) {
  // Matières premières avec alerte (stock <= seuil)
  const lowStock = materials.filter(m => 
    m.alert_threshold && m.stock <= m.alert_threshold
  )
  
  // Matières premières en rupture
  const outOfStock = materials.filter(m => m.stock <= 0)
  
  // Alertes basées sur seuil fixe (< 10)
  const lowStockFixed = materials.filter(m => m.stock > 0 && m.stock < 10)
  
  // Combiner toutes les alertes
  const allAlerts = [...new Set([...outOfStock, ...lowStock, ...lowStockFixed])]
  
  // Top 5 matières avec le stock le plus bas (en %)
  const stockPercentages = materials
    .filter(m => m.alert_threshold && m.alert_threshold > 0)
    .map(m => ({
      ...m,
      percentage: (m.stock / m.alert_threshold) * 100
    }))
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5)

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span>📦</span>
        <span>État des stocks</span>
        {allAlerts.length > 0 && (
          <span className="ml-auto text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">
            {allAlerts.length}
          </span>
        )}
      </h3>
      
      {/* Résumé des alertes */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-3 rounded-lg ${outOfStock.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-red-600">{outOfStock.length}</div>
          <div className="text-xs text-gray-600">Rupture de stock</div>
        </div>
        <div className={`p-3 rounded-lg ${lowStock.length > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-orange-600">{lowStock.length}</div>
          <div className="text-xs text-gray-600">Stock faible</div>
        </div>
      </div>

      {/* Liste des alertes critiques */}
      {allAlerts.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase">🔔 Alertes actives</p>
          {allAlerts.slice(0, 3).map(m => {
            const isCritical = m.stock <= 0
            
            return (
              <div key={m.id} className={`flex items-center justify-between p-2 rounded-lg border ${
                isCritical ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
              }`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-600">Stock: {m.stock}</p>
                </div>
                <div className="text-right">
                  {isCritical ? (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                      Rupture
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                      Stock faible
                    </span>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{m.unit_cost?.toFixed(2)} €/unité</p>
                </div>
              </div>
            )
          })}
          {allAlerts.length > 3 && (
            <p className="text-xs text-center text-gray-500 py-1">
              + {allAlerts.length - 3} autre{allAlerts.length - 3 > 1 ? 's' : ''} alerte{allAlerts.length - 3 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* État des stocks (top 5 plus bas) */}
      {stockPercentages.length > 0 && (
        <div className="space-y-2 border-t pt-4">
          <p className="text-xs font-medium text-gray-500 uppercase">📊 Niveaux de stock</p>
          {stockPercentages.map(m => {
            const isLow = m.percentage <= 100
            const isCritical = m.stock <= 0
            
            return (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">
                    {m.stock} / {m.alert_threshold}
                  </p>
                </div>
                <div className="ml-3">
                  {isCritical ? (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                      0%
                    </span>
                  ) : isLow ? (
                    <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                      {m.percentage.toFixed(0)}%
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      OK
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {allAlerts.length === 0 && stockPercentages.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          ✅ Aucun seuil d'alerte défini.<br/>
          <span className="text-xs">Configurez les seuils dans Paramètres → Matières premières</span>
        </div>
      )}
    </div>
  )
}
