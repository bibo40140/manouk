import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createServiceRoleClient()

    // Vérifier que l'utilisateur est admin
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer tous les utilisateurs
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Récupérer toutes les associations user_companies
    const { data: userCompanies, error: ucError } = await supabase
      .from('user_companies')
      .select('user_id, company_id, company:companies(id, name)')
    
    if (ucError) {
      return NextResponse.json({ error: ucError.message }, { status: 500 })
    }

    // Combiner les données
    const usersWithCompanies = users.map(user => {
      const associations = userCompanies?.filter(uc => uc.user_id === user.id) || []
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        companies: associations.map(a => ({
          id: a.company_id,
          name: (a.company as any)?.name || 'N/A'
        }))
      }
    })

    return NextResponse.json({ users: usersWithCompanies })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur' }, { status: 500 })
  }
}
