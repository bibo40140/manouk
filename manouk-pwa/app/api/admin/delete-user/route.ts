import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body as { userId: string }

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    // Supprimer d'abord les associations user_companies
    const { error: ucError } = await supabase
      .from('user_companies')
      .delete()
      .eq('user_id', userId)
    
    if (ucError) {
      console.error('Erreur suppression user_companies:', ucError)
      // Continue même si erreur, au cas où il n'y a pas d'association
    }

    // Supprimer l'utilisateur de auth.users
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur' }, { status: 500 })
  }
}
