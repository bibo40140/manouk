import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsTabs from '@/components/settings/SettingsTabs'


export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  // Récupère la société du user connecté (mono-société)
  const { data: companies } = await supabase.from('companies').select('*').eq('user_id', user.id).order('name')
  const company = companies?.[0]
  if (!company) {
    return <div className="p-8 text-red-600">Aucune société associée à votre compte.</div>
  }
  const companyId = company.id
  // Filtrer toutes les requêtes par company_id
  const { data: products } = await supabase.from('products').select('*').eq('company_id', companyId).order('name')
  const { data: rawMaterials } = await supabase.from('raw_materials').select('*').eq('company_id', companyId).order('name')
  const { data: customers } = await supabase.from('customers').select('*, company:companies(name)').eq('company_id', companyId).order('name')
  const { data: suppliers } = await supabase.from('suppliers').select('*, company:companies(name)').eq('company_id', companyId).order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">⚙️ Paramètres</h1>
      
      <SettingsTabs 
        companies={[company]}
        products={products || []}
        rawMaterials={rawMaterials || []}
        customers={customers || []}
        suppliers={suppliers || []}
      />
    </div>
  )
}
