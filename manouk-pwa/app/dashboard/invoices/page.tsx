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

  // Récupérer les données nécessaires
  const [
    { data: invoices },
    { data: companies },
    { data: customers },
    { data: products }
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(id, name, email),
        company:companies(id, name, code),
        invoice_lines(*, product:products(name))
      `)
      .order('date', { ascending: false }),
    supabase.from('companies').select('*').order('name'),
    supabase.from('customers').select('*').order('name'),
    supabase.from('products').select('*').order('name')
  ])

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
      />
    </div>
  )
}
