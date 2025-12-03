import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, userId, companyId } = body as { 
      action: 'add' | 'update' | 'delete'
      userId: string
      companyId?: string 
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    switch (action) {
      case 'add':
        if (!companyId) {
          return NextResponse.json({ error: 'companyId requis pour add' }, { status: 400 })
        }
        const { error: addError } = await supabase
          .from('user_companies')
          .insert({ user_id: userId, company_id: companyId })
        if (addError) {
          return NextResponse.json({ error: addError.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, message: 'Société ajoutée avec succès' })

      case 'update':
        if (!companyId) {
          return NextResponse.json({ error: 'companyId requis pour update' }, { status: 400 })
        }
        // Supprimer toutes les associations existantes
        const { error: deleteError } = await supabase
          .from('user_companies')
          .delete()
          .eq('user_id', userId)
        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }
        // Créer la nouvelle association
        const { error: insertError } = await supabase
          .from('user_companies')
          .insert({ user_id: userId, company_id: companyId })
        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, message: 'Société mise à jour avec succès' })

      case 'delete':
        const { error: delError } = await supabase
          .from('user_companies')
          .delete()
          .eq('user_id', userId)
        if (delError) {
          return NextResponse.json({ error: delError.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, message: 'Association supprimée avec succès' })

      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur' }, { status: 500 })
  }
}
