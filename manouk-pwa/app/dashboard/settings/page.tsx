import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsTabs from '@/components/settings/SettingsTabs'


export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
  const client = isAdmin ? await createServiceRoleClient() : supabase
  // Récupère les sociétés visibles
  const { data: companies } = await client.from('companies').select('*').order('name')
  
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">⚙️ Paramètres</h1>
      
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
