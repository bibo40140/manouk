import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { companyId, rawMaterialId, quantity, unitCost, purchaseDate, paid } = await request.json()

    if (!companyId || !rawMaterialId || !quantity || !unitCost || !purchaseDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create admin client that bypasses RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create the purchase
    const { data, error } = await supabaseAdmin
      .from('purchases')
      .insert([{
        company_id: companyId,
        raw_material_id: rawMaterialId,
        quantity: parseFloat(quantity),
        unit_cost: parseFloat(unitCost),
        purchase_date: purchaseDate,
        paid: paid || false
      }])
      .select()

    if (error) {
      console.error('Error creating purchase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in create-purchase route:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
