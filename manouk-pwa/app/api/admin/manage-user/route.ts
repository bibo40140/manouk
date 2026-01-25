import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function DELETE(req: Request) {
  try {
    const { userId, companyId } = await req.json()
    if (!userId || !companyId) {
      return NextResponse.json({ error: 'userId et companyId requis' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Supprimer l'association user_companies
    const { error: deleteErr } = await supabase
      .from('user_companies')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId)
    
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    // Vérifier s'il reste d'autres associations pour cet utilisateur
    const { data: remaining, error: checkErr } = await supabase
      .from('user_companies')
      .select('user_id')
      .eq('user_id', userId)
      .limit(1)
    
    // Si plus aucune association, supprimer l'utilisateur de auth.users
    if (!checkErr && (!remaining || remaining.length === 0)) {
      const { error: authErr } = await supabase.auth.admin.deleteUser(userId)
      if (authErr) {
        console.error('Erreur suppression auth.users:', authErr)
        // On continue quand même car l'association est supprimée
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, companyId, newRole } = await req.json()
    if (!userId || !companyId || !newRole) {
      return NextResponse.json({ error: 'userId, companyId et newRole requis' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Mettre à jour le rôle
    const { error: updateErr } = await supabase
      .from('user_companies')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('company_id', companyId)
    
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
