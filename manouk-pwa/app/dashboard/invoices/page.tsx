import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import InvoicesList from '@/components/invoices/InvoicesList'
import InvoiceModal from '@/components/invoices/InvoiceModal'
import ExportButton from '@/components/invoices/ExportButton'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
  
  // Utiliser serviceRoleClient pour tous pour bypass RLS
  const client = await createServiceRoleClient()

  // IMPORTANT: Charger TOUTES les sociétés pour permettre l'édition des splits
  const { data: allCompanies } = await client.from('companies').select('id, name, code').order('name')
  
  // Pour les utilisateurs non-admin, charger leurs sociétés autorisées
  let companies = allCompanies || []
  let userCompanies = allCompanies || []
  
  if (!isAdmin) {
    const { data: userCompRel } = await client
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
    
    if (userCompRel && userCompRel.length > 0) {
      const userCompanyIds = userCompRel.map(r => r.company_id)
      userCompanies = (allCompanies || []).filter(c => userCompanyIds.includes(c.id))
    }
    
    if (userCompanies.length === 0) {
      return <div className="p-8 text-red-600">Aucune société associée à votre compte.</div>
    }
  }

  const cookieCompany = (await cookies()).get('activeCompanyId')?.value || null
  let companyId: string | null = null
  
  // Déterminer la société active pour filtrer les données
  if (isAdmin) {
    // Admin voit tout par défaut, sauf s'il a sélectionné une société spécifique
    if (cookieCompany && cookieCompany !== 'all' && companies) {
      const found = companies.find(c => c.id === cookieCompany)
      companyId = found ? found.id : null
    }
  } else {
    // Utilisateur normal : utiliser sa première société autorisée
    if (userCompanies && userCompanies.length > 0) {
      companyId = userCompanies[0].id
    }
  }

  // IMPORTANT: On charge TOUS les clients et produits (même si société active)
  // pour permettre la création de factures multi-sociétés et voir les splits
  const { data: customers } = await client.from('customers').select('*').order('name')
  const { data: products } = await client.from('products').select('*').order('name')
  
  // Charger les splits pour tous les produits
  const { data: allSplits } = await client.from('product_company_splits').select('*')
  
  // Enrichir les produits avec leurs splits
  const productsWithSplits = (products || []).map((p: any) => {
    const splits = (companies || []).map((c: any) => {
      const found = allSplits?.find((s: any) => s.product_id === p.id && s.company_id === c.id);
      return { company_id: c.id, amount: found ? Number(found.amount) : 0 };
    });
    return { ...p, splits };
  });

  let invoicesQuery = client
    .from('invoices')
    .select(`
      id,
      invoice_number,
      date,
      total,
      paid,
      company_id,
      customer_id,
      email_sent,
      email_sent_date,
      urssaf_amount,
      urssaf_declared_date,
      urssaf_paid_date,
      urssaf_paid_amount,
      customer:customers(id, name, email),
      company:companies(id, name, code),
      invoice_lines(*, product:products(name))
    `)
    .order('date', { ascending: false })
  
  // IMPORTANT: Filtrer par société pour que chaque utilisateur ne voie que SES factures
  if (companyId) {
    invoicesQuery = invoicesQuery.eq('company_id', companyId)
  }
  
  const { data: rawInvoices } = await invoicesQuery

  // Transformer les données Supabase: customer et company sont des tableaux, on prend le premier élément
  const invoices = (rawInvoices || []).map((inv: any) => ({
    ...inv,
    customer: Array.isArray(inv.customer) ? inv.customer[0] : inv.customer,
    company: Array.isArray(inv.company) ? inv.company[0] : inv.company,
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📄 Factures</h1>
        <div className="flex items-center gap-4">
          <ExportButton invoices={invoices} />
          <InvoiceModal companies={allCompanies || []} customers={customers || []} products={productsWithSplits || []} />
        </div>
      </div>

      <InvoicesList 
        invoices={invoices} 
        companies={companies || []}
        customers={customers || []}
        products={products || []}
        defaultCompanyId={companyId || undefined}
      />
    </div>
  )
}
