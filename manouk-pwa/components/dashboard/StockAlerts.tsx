'use client'

export default function StockAlerts({ materials }: { materials: any[] }) {
  const lowStockItems = materials.filter(m => m.stock < 10)
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span>⚠️</span>
        <span>Alertes de stock</span>
        {lowStockItems.length > 0 && (
          <span className="ml-auto text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">
            {lowStockItems.length}
          </span>
        )}
      </h3>
      
      {lowStockItems.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          ✅ Tous les stocks sont corrects
        </div>
      ) : (
        <div className="space-y-2">
          {lowStockItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">Stock actuel: {item.stock}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-red-600">Stock faible</p>
                <p className="text-xs text-gray-500">{item.unit_cost.toFixed(2)} €/unité</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
