import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(request: Request) {
  try {
    const { companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Create admin client that bypasses RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Delete the company
    const { error } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', companyId)

    if (error) {
      console.error('Error deleting company:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in delete-company route:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
