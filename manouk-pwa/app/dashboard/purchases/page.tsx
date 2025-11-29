import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PurchasesList from '@/components/purchases/PurchasesList'
import PurchaseModal from '@/components/purchases/PurchaseModal'

export default async function PurchasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer les données nécessaires
  const [
    { data: purchases },
    { data: companies },
    { data: suppliers },
    { data: rawMaterials }
  ] = await Promise.all([
    supabase
      .from('purchases')
      .select(`
        *,
        supplier:suppliers(id, name),
        raw_material:raw_materials(id, name, unit),
        company:companies(id, name, code)
      `)
      .order('purchase_date', { ascending: false }),
    supabase.from('companies').select('*').order('name'),
    supabase.from('suppliers').select('*').order('name'),
    supabase.from('raw_materials').select('*').order('name')
  ])

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
