
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
  // Sociétés autorisées (RLS)
  const { data: companies } = await client.from('companies').select('id, name, code').order('name')
  if (!isAdmin && (!companies || companies.length === 0)) {
    return <div className="p-8 text-red-600">Aucune société associée à votre compte.</div>
  }
  const cookieCompany = (await cookies()).get('activeCompanyId')?.value || null
  let companyId: string | null = null
  if (cookieCompany && cookieCompany !== 'all' && companies) {
    const found = companies.find(c => c.id === cookieCompany)
    companyId = found ? found.id : null
  } else if (cookieCompany === 'all') {
    companyId = null
  } else {
    if (companies && companies.length === 1) companyId = companies[0].id
    else companyId = null
  }
  // Admin: par défaut voit tout, mais s'il a sélectionné une société via le cookie, on respecte ce filtre

  let suppliersQuery = client.from('suppliers').select('*').order('name')
  let rawMaterialsQuery = client.from('raw_materials').select('*').order('name')
  if (companyId) {
    suppliersQuery = suppliersQuery.eq('company_id', companyId)
    rawMaterialsQuery = rawMaterialsQuery.eq('company_id', companyId)
  }
  const { data: suppliers } = await suppliersQuery
  const { data: rawMaterials } = await rawMaterialsQuery
  let purchasesQuery = client
    .from('purchases')
    .select(`
      *,
      supplier:suppliers(id, name),
      raw_material:raw_materials(id, name, unit),
      company:companies(id, name, code)
    `)
    .order('purchase_date', { ascending: false })
  if (companyId) purchasesQuery = purchasesQuery.eq('company_id', companyId)
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
