import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import InvoicesList from '@/components/invoices/InvoicesList'
import InvoiceModal from '@/components/invoices/InvoiceModal'
import CompanyFilter from '@/components/dashboard/CompanyFilter'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
  const client = isAdmin ? await createServiceRoleClient() : supabase

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

  let customersQuery = client.from('customers').select('*').order('name')
  let productsQuery = client.from('products').select('*').order('name')
  if (companyId) {
    customersQuery = customersQuery.eq('company_id', companyId)
    productsQuery = productsQuery.eq('company_id', companyId)
  }
  const { data: customers } = await customersQuery
  const { data: products } = await productsQuery

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
  if (companyId) invoicesQuery = invoicesQuery.eq('company_id', companyId)
  const { data: invoices } = await invoicesQuery

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📄 Factures</h1>
        <CompanyFilter companies={companies || []} canSeeAllOverride={isAdmin || (companies ? companies.length > 1 : false)} />
        <InvoiceModal companies={companies || []} customers={customers || []} products={products || []} />
      </div>

      <InvoicesList 
        invoices={invoices || []} 
        companies={companies || []}
        customers={customers || []}
        products={products || []}
        defaultCompanyId={companyId || undefined}
      />
    </div>
  )
}
