import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvoicesList from '@/components/invoices/InvoicesList'
import InvoiceModal from '@/components/invoices/InvoiceModal'
import { cookies } from 'next/headers'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: companies } = await supabase.from('companies').select('*').order('name')
  const { data: customers } = await supabase.from('customers').select('*').order('name')
  const { data: products } = await supabase.from('products').select('*').order('name')

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

  // Toujours charger toutes les factures, filtrage côté client
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, name, email),
      company:companies(id, name, code),
      invoice_lines(*, product:products(name))
    `)
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📄 Factures</h1>
        <InvoiceModal companies={companies || []} customers={customers || []} products={products || []} />
      </div>

      <InvoicesList 
        invoices={invoices || []} 
        companies={companies || []}
        customers={customers || []}
        products={products || []}
        defaultCompanyId={companyId}
      />
    </div>
  )
}
