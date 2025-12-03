
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PurchasesList from '@/components/purchases/PurchasesList'
import PurchaseModal from '@/components/purchases/PurchaseModal'
import CompanyFilter from '@/components/dashboard/CompanyFilter'
import { cookies } from 'next/headers'


export default async function PurchasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
  const client = isAdmin ? await createServiceRoleClient() : supabase
  // Charger toutes les sociétés
  const { data: companies } = await client.from('companies').select('id, name, code, user_id').order('name')
  // Gérer le filtre de société
  const cookieCompany = (await cookies()).get('activeCompanyId')?.value || null
  let companyId: string | null = null
  
  if (cookieCompany && cookieCompany !== 'all' && companies) {
    const found = companies.find(c => c.id === cookieCompany)
    companyId = found ? found.id : null
  } else if (cookieCompany === 'all') {
    companyId = null
  } else {
    // Par défaut, afficher tous les achats (null)
    companyId = null
  }

  // Charger toutes les données (tous les fournisseurs et matières premières)
  const { data: suppliers } = await client.from('suppliers').select('*').order('name')
  const { data: rawMaterials } = await client.from('raw_materials').select('*').order('name')
  let purchasesQuery = client
    .from('purchases')
    .select(`
      *,
      supplier:suppliers(id, name),
      raw_material:raw_materials(id, name, unit),
      company:companies(id, name, code)
    `)
    .order('purchase_date', { ascending: false })
  
  // Filtrer par société seulement si une société spécifique est sélectionnée
  // Si companyId est null (toutes les sociétés), on charge tout
  if (companyId) {
    purchasesQuery = purchasesQuery.eq('company_id', companyId)
  }
  
  const { data: purchases } = await purchasesQuery

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">🛒 Achats</h1>
        <CompanyFilter companies={companies || []} canSeeAllOverride={isAdmin || (companies ? companies.length > 1 : false)} />
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
