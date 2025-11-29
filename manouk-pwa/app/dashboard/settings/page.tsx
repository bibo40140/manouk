import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsTabs from '@/components/settings/SettingsTabs'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer toutes les données
  const [
    { data: companies },
    { data: products },
    { data: rawMaterials },
    { data: customers },
    { data: suppliers }
  ] = await Promise.all([
    supabase.from('companies').select('*').order('name'),
    supabase.from('products').select('*').order('name'),
    supabase.from('raw_materials').select('*').order('name'),
    supabase.from('customers').select('*, company:companies(name)').order('name'),
    supabase.from('suppliers').select('*, company:companies(name)').order('name')
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">⚙️ Paramètres</h1>
      
      <SettingsTabs 
        companies={companies || []}
        products={products || []}
        rawMaterials={rawMaterials || []}
        customers={customers || []}
        suppliers={suppliers || []}
      />
    </div>
  )
}
