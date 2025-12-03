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

    // Récupérer toutes les sociétés
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ companies })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur' }, { status: 500 })
  }
}
