
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PurchasesList from '@/components/purchases/PurchasesList'
import PurchaseModal from '@/components/purchases/PurchaseModal'
import { cookies } from 'next/headers'


export default async function PurchasesPage() {
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
  const { data: suppliers } = await supabase.from('suppliers').select('*').eq('company_id', companyId).order('name')
  const { data: rawMaterials } = await supabase.from('raw_materials').select('*').eq('company_id', companyId).order('name')
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:suppliers(id, name),
      raw_material:raw_materials(id, name, unit),
      company:companies(id, name, code)
    `)
    .eq('company_id', companyId)
    .order('purchase_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">🛒 Achats</h1>
        <PurchaseModal 
          companies={[company]} 
          suppliers={suppliers || []} 
          rawMaterials={rawMaterials || []} 
        />
      </div>

      <PurchasesList 
        purchases={purchases || []} 
        companies={[company]}
        suppliers={suppliers || []}
        rawMaterials={rawMaterials || []}
      />
    </div>
  )
}
