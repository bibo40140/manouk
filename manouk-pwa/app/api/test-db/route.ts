import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    
    // Test 1: Vérifier les tables existantes
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5)
    
    // Test 2: Vérifier si user_companies existe
    const { data: userCompanies, error: ucError } = await supabase
      .from('user_companies')
      .select('*')
      .limit(1)
    
    return NextResponse.json({
      ok: true,
      tests: {
        companies: {
          success: !companiesError,
          count: companies?.length || 0,
          error: companiesError?.message,
          data: companies
        },
        user_companies: {
          success: !ucError,
          exists: !ucError,
          error: ucError?.message,
          data: userCompanies
        }
      }
    })
  } catch (e: any) {
    return NextResponse.json({ 
      ok: false, 
      error: e.message 
    }, { status: 500 })
  }
}
