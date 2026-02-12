import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import SettingsTabs from '@/components/settings/SettingsTabs'
import GlobalExportButton from '@/components/settings/GlobalExportButton'
import CompanyFilter from '@/components/dashboard/CompanyFilter'


export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
  const client = isAdmin ? await createServiceRoleClient() : supabase
  
  // IMPORTANT: Toujours charger TOUTES les sociétés (bypass RLS) pour permettre l'édition des splits
  const serviceClient = await createServiceRoleClient()
  const { data: companies } = await serviceClient.from('companies').select('*').order('name')
  
  // Charge les produits ET leurs splits
  const { data: products } = await client.from('products').select('*').order('name')
  const { data: allSplits } = await client.from('product_company_splits').select('*')
  const { data: rawMaterials } = await client.from('raw_materials').select('*').order('name')
  
  // Enrichir les produits avec leurs splits
  const productsWithSplits = (products || []).map((p: any) => {
    const splits = (companies || []).map((c: any) => {
      const found = allSplits?.find((s: any) => s.product_id === p.id && s.company_id === c.id);
      return { company_id: c.id, amount: found ? Number(found.amount) : 0 };
    });
    return { ...p, splits };
  });
  
  console.log('🔍 SETTINGS PAGE - Products loaded:', products?.length);
  console.log('🔍 SETTINGS PAGE - Splits loaded:', allSplits?.length);
  console.log('🔍 SETTINGS PAGE - Products with splits:', productsWithSplits.length);
  console.log('🔍 SETTINGS PAGE - Raw materials loaded:', rawMaterials?.length);
  
  const { data: customers } = await client.from('customers').select('*, company:companies(name)').order('name')
  const { data: suppliers } = await client.from('suppliers').select('*, company:companies(name)').order('name')
  const { data: fixedCosts } = await client.from('fixed_costs').select('*').order('name')

  // Récupérer la société active depuis le cookie
  const cookieCompany = (await cookies()).get('activeCompanyId')?.value || null
  let companyId: string | null = null
  if (cookieCompany && cookieCompany !== 'all' && companies) {
    const found = companies.find(c => c.id === cookieCompany)
    companyId = found ? found.id : null
  } else if (cookieCompany === 'all') {
    companyId = null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Paramètres</h1>
        <CompanyFilter companies={companies || []} canSeeAllOverride={isAdmin || (companies ? companies.length > 1 : false)} />
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Export des données</h2>
        <p className="text-gray-600 mb-4">
          Exportez toutes vos données (factures, achats, clients, produits + statistiques) au format Excel.
          L'export respecte le filtre de société sélectionné.
        </p>
        <GlobalExportButton companyId={companyId || 'all'} />
      </div>
      
      <SettingsTabs 
        companies={companies || []}
        products={productsWithSplits || []}
        rawMaterials={rawMaterials || []}
        customers={customers || []}
        suppliers={suppliers || []}
        fixedCosts={fixedCosts || []}
      />
    </div>
  )
}
