import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DeliveriesHistory from '@/components/deliveries/DeliveriesHistory'

export default async function DeliveriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const client = createServiceRoleClient()

  const { data: customers } = await client
    .from('customers')
    .select('id, name')
    .order('name')

  const { data: productions } = await client
    .from('productions')
    .select(`
      id,
      quantity,
      production_date,
      notes,
      product:products(id, name, stock)
    `)
    .order('production_date', { ascending: false })

  const { data: deliveredLinks } = await client
    .from('delivery_productions')
    .select('production_id')

  const deliveredSet = new Set((deliveredLinks || []).map((row: any) => row.production_id))
  const availableProductions = (productions || []).filter((p: any) => !deliveredSet.has(p.id))

  const { data: deliveries } = await client
    .from('deliveries')
    .select(`
      id,
      customer_id,
      delivery_date,
      notes,
      invoiced_at,
      created_at,
      customer:customers(id, name),
      delivery_productions(
        production_id,
        production:productions(id, quantity, production_date, product:products(id, name))
      )
    `)
    .order('delivery_date', { ascending: false })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Livraisons</h1>
      </div>

      <DeliveriesHistory
        deliveries={deliveries || []}
        customers={customers || []}
        productions={availableProductions || []}
        allProductions={productions || []}
      />
    </div>
  )
}
