import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsTabs from '@/components/settings/SettingsTabs'


export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  // Utiliser le service role client pour charger toutes les données sans restriction RLS
  const client = await createServiceRoleClient()
  
  // Récupère toutes les sociétés
  const { data: companies } = await client.from('companies').select('*').order('name')
  // Priorise la société associée à l'utilisateur si elle existe
  const userCompany = companies?.find(c => c.user_id === user.id) || companies?.[0]
  const companyId = userCompany ? userCompany.id : companies?.[0]?.id
  // Charge toutes les données, sans filtrer uniquement sur la société
  const { data: products } = await client.from('products').select('*').order('name')
  const { data: rawMaterials } = await client.from('raw_materials').select('*').order('name')
  const { data: customers } = await client.from('customers').select('*, company:companies(name)').order('name')
  const { data: suppliers } = await client.from('suppliers').select('*, company:companies(name)').order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">⚙️ Paramètres</h1>
      <SettingsTabs 
        companies={companies || []}
        products={products || []}
        rawMaterials={rawMaterials || []}
        customers={customers || []}
        suppliers={suppliers || []}
        userEmail={user.email}
        selectedCompanyId={companyId}
      />
    </div>
  )
}
