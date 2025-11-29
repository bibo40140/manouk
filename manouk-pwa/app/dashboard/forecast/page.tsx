import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ForecastSimulator from '@/components/forecast/ForecastSimulator'

export default async function ForecastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer les données nécessaires pour la simulation
  const [
    { data: products },
    { data: rawMaterials }
  ] = await Promise.all([
    supabase.from('products').select('*, product_materials(*, raw_material:raw_materials(*))'),
    supabase.from('raw_materials').select('*')
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">💰 Trésorerie prévisionnelle</h1>
      
      <ForecastSimulator 
        products={products || []}
        rawMaterials={rawMaterials || []}
      />
    </div>
  )
}
