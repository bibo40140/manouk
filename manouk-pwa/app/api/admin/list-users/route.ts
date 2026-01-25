import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Récupérer tous les utilisateurs depuis auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Récupérer les associations user_companies
    const { data: userCompanies, error: ucError } = await supabase
      .from('user_companies')
      .select(`
        user_id,
        company_id,
        role,
        companies (
          name
        )
      `)
    
    if (ucError) {
      return NextResponse.json({ error: ucError.message }, { status: 500 })
    }

    // Créer une map email par user_id
    const emailMap = new Map<string, string>()
    authData.users.forEach(u => {
      if (u.id && u.email) {
        emailMap.set(u.id, u.email)
      }
    })

    // Combiner les données
    const result = (userCompanies || []).map((uc: any) => ({
      user_id: uc.user_id,
      email: emailMap.get(uc.user_id) || 'Email non trouvé',
      company_id: uc.company_id,
      company_name: uc.companies?.name || 'N/A',
      role: uc.role || 'member'
    }))

    return NextResponse.json({ users: result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
