
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

  const { data: companies } = await supabase.from('companies').select('*').order('name')
  const { data: suppliers } = await supabase.from('suppliers').select('*').order('name')
  const { data: rawMaterials } = await supabase.from('raw_materials').select('*').order('name')

  // Lire la société active depuis le cookie (set côté client par le hook)
  let companyId = 'all'
  let cookieStore
  try {
    cookieStore = await cookies()
  } catch (e) {}
  if (cookieStore) {
    companyId = cookieStore.get('active_company_id')?.value || companies?.[0]?.id || 'all'
  } else {
    companyId = companies?.[0]?.id || 'all'
  }

  // Filtrer les achats par société
  let purchasesQuery = supabase
    .from('purchases')
    .select(`
      *,
      supplier:suppliers(id, name),
      raw_material:raw_materials(id, name, unit),
      company:companies(id, name, code)
    `)
    .order('purchase_date', { ascending: false })
  if (companyId && companyId !== 'all') {
    purchasesQuery = purchasesQuery.eq('company_id', companyId)
  }
  const { data: purchases } = await purchasesQuery

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">🛒 Achats</h1>
        <PurchaseModal 
          companies={companies || []} 
          suppliers={suppliers || []} 
          rawMaterials={rawMaterials || []} 
        />
      </div>

      <PurchasesList 
        purchases={purchases || []} 
        companies={companies || []}
        suppliers={suppliers || []}
        rawMaterials={rawMaterials || []}
      />
    </div>
  )
}
