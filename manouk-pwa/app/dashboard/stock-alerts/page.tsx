import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StockAlerts from '@/components/stock/StockAlerts'

export default async function StockAlertsPage() {
  console.log('🔔 [STOCK ALERTS PAGE] Chargement...')
  
  // Utiliser createClient pour vérifier l'auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  console.log('🔔 [STOCK ALERTS PAGE] User:', user?.email)
  
  if (!user) {
    console.log('🔔 [STOCK ALERTS PAGE] Pas d\'utilisateur, redirection /login')
    redirect('/login')
  }

  // Utiliser serviceRoleClient pour les queries
  const supabaseAdmin = await createServiceRoleClient()
  
  // Récupérer toutes les alertes avec les infos des sociétés
  console.log('🔔 [STOCK ALERTS PAGE] Récupération alertes...')
  const { data: alerts, error } = await supabaseAdmin
    .from('stock_alerts')
    .select(`
      *,
      company:companies(name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [STOCK ALERTS PAGE] Erreur chargement alertes:', error)
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Erreur de chargement</h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          <p className="text-sm text-red-600">
            La table stock_alerts n'existe peut-être pas encore. Exécutez le script :
            <code className="block mt-2 bg-red-100 p-2 rounded">
              \i scripts/create-stock-alerts-table.sql
            </code>
          </p>
        </div>
      </div>
    )
  }

  console.log('🔔 [STOCK ALERTS PAGE] Alertes chargées:', alerts?.length || 0)

  return (
    <div className="space-y-6">
      <StockAlerts alerts={alerts || []} />
    </div>
  )
}
