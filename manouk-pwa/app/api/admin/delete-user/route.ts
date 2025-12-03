import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body as { userId: string }

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    console.log('[delete-user] Starting deletion for userId:', userId)

    // 1. Mettre à NULL les user_id des sociétés créées par cet utilisateur
    console.log('[delete-user] Setting companies user_id to NULL...')
    const { error: companyError } = await supabase
      .from('companies')
      .update({ user_id: null })
      .eq('user_id', userId)
    
    if (companyError) {
      console.error('[delete-user] Error updating companies:', companyError)
      return NextResponse.json({ 
        error: `Erreur mise à jour sociétés: ${companyError.message}`,
        details: companyError 
      }, { status: 500 })
    }
    console.log('[delete-user] Companies updated successfully')

    // 2. Supprimer les associations user_companies
    console.log('[delete-user] Deleting user_companies...')
    const { error: ucError } = await supabase
      .from('user_companies')
      .delete()
      .eq('user_id', userId)
    
    if (ucError) {
      console.error('[delete-user] Error deleting user_companies:', ucError)
      return NextResponse.json({ 
        error: `Erreur suppression associations: ${ucError.message}`,
        details: ucError 
      }, { status: 500 })
    }
    console.log('[delete-user] user_companies deleted successfully')

    // Désactiver l'utilisateur en supprimant toutes ses sessions et en le bloquant
    console.log('[delete-user] Disabling auth user...')
    
    // Déconnecter l'utilisateur (supprimer toutes ses sessions)
    const { error: signOutError } = await supabase.auth.admin.signOut(userId)
    if (signOutError) {
      console.error('[delete-user] Error signing out user:', signOutError)
    }
    
    // Tenter de supprimer l'utilisateur
    // Si ça échoue à cause de contraintes FK, on le désactive à la place
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId, true) // shouldSoftDelete = true
    
    if (deleteError) {
      console.error('[delete-user] Cannot delete user (has related data), will update email instead:', deleteError)
      
      // Impossible de supprimer à cause de données liées
      // On va "anonymiser" l'utilisateur en changeant son email
      const anonymousEmail = `deleted_${userId.substring(0, 8)}@deleted.local`
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        email: anonymousEmail,
        email_confirm: true,
        password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        user_metadata: { deleted: true, deleted_at: new Date().toISOString() }
      })
      
      if (updateError) {
        console.error('[delete-user] Error anonymizing user:', updateError)
        return NextResponse.json({ 
          error: `Impossible de supprimer l'utilisateur (données associées). Erreur: ${updateError.message}`,
          details: updateError 
        }, { status: 500 })
      }
      
      console.log('[delete-user] User anonymized successfully')
      return NextResponse.json({ 
        success: true, 
        message: 'Utilisateur désactivé avec succès (email et mot de passe modifiés)'
      })
    }
    
    console.log('[delete-user] Auth user deleted successfully')
    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès' })
  } catch (e: any) {
    console.error('Error in delete-user route:', e)
    return NextResponse.json({ error: e.message ?? 'Erreur inconnue' }, { status: 500 })
  }
}
