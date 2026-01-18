'use client'

export default function ProductStats({ 
  products, 
  invoices 
}: { 
  products: any[]
  invoices: any[] 
}) {
  // Calculer les stats par produit
  const productStats = products.map(product => {
    // Pour simplifier, on compte le nombre de factures mentionnant ce produit
    // Dans une vraie app, il faudrait avoir une table invoice_items
    const productInvoices = invoices.filter(inv => 
      inv.description?.toLowerCase().includes(product.name.toLowerCase())
    )
    
    const totalSales = productInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const quantity = productInvoices.length // Approximation
    
    return {
      ...product,
      quantity,
      totalSales,
      avgPrice: quantity > 0 ? totalSales / quantity : 0
    }
  }).sort((a, b) => b.totalSales - a.totalSales)

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📦 Statistiques produits
      </h3>
      
      {productStats.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Aucun produit
        </div>
      ) : (
        <div className="space-y-3">
          {productStats.map((product) => (
            <div key={product.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm font-semibold text-indigo-600">{product.totalSales.toFixed(2)} €</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div>
                  <p className="text-gray-400">Vendus</p>
                  <p className="font-medium">{product.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-400">Prix moyen</p>
                  <p className="font-medium">{product.avgPrice.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-gray-400">Prix catalogue</p>
                  <p className="font-medium">{product.price?.toFixed(2) || '0.00'} €</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
