
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvoicesList from '@/components/invoices/InvoicesList'
import InvoiceModal from '@/components/invoices/InvoiceModal'

export default async function InvoicesPage() {

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

  // Filtrer toutes les requêtes par company_id
  const { data: customers } = await supabase.from('customers').select('*').eq('company_id', companyId).order('name')
  const { data: products } = await supabase.from('products').select('*').eq('company_id', companyId).order('name')
  const { data: invoices } = await supabase
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
    .eq('company_id', companyId)
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📄 Factures</h1>
        <InvoiceModal companies={[company]} customers={customers || []} products={products || []} />
      </div>

      <InvoicesList 
        invoices={invoices || []} 
        companies={[company]}
        customers={customers || []}
        products={products || []}
        defaultCompanyId={companyId}
      />
    </div>
  )
}
