import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, companyId, role, password } = body as { email: string; companyId: string; role?: string; password?: string }
    console.log('📧 Création utilisateur:', { email, companyId, role, hasPassword: !!password })
    
    if (!email || !companyId) {
      return NextResponse.json({ error: 'email et companyId requis' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    console.log('✅ Service role client créé')

    // Create user with password or invite
    console.log(password ? '🔑 Création avec mot de passe...' : '🚀 Invitation utilisateur...')
    let userId: string | undefined
    
    // Si un mot de passe est fourni, créer directement l'utilisateur
    let userErr: any = null
    let userData: any = null
    
    if (password) {
      const result = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirmer l'email en local
      })
      userData = result.data
      userErr = result.error
    } else {
      const result = await supabase.auth.admin.inviteUserByEmail(email)
      userData = result.data
      userErr = result.error
    }
    
    if (userErr) {
      // Si l'utilisateur existe déjà, on le récupère
      if (userErr.message?.includes('already been registered') || userErr.message?.includes('email_exists')) {
        console.log('⚠️ Utilisateur existe déjà, récupération...')
        const { data: existingUsers, error: listErr } = await supabase.auth.admin.listUsers()
        if (listErr) {
          console.error('❌ Erreur récupération utilisateurs:', listErr)
          return NextResponse.json({ error: 'Impossible de récupérer l\'utilisateur existant' }, { status: 500 })
        }
        const existingUser = existingUsers?.users?.find(u => u.email === email)
        if (!existingUser) {
          return NextResponse.json({ error: 'Utilisateur existe mais introuvable' }, { status: 500 })
        }
        userId = existingUser.id
        console.log('✅ Utilisateur existant récupéré:', userId)
      } else {
        console.error('❌ Erreur invitation:', userErr)
        return NextResponse.json({ error: userErr.message }, { status: 500 })
      }
    } else {
      userId = userData?.user?.id
      console.log('✅ Utilisateur créé:', userId)
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Création utilisateur échouée' }, { status: 500 })
    }

    // Map user to company (handle old schema without 'role' column)
    console.log('🔗 Association utilisateur → société...')
    let mapErr: any = null
    {
      const { error } = await supabase.from('user_companies').insert({
        user_id: userId,
        company_id: companyId,
        role: role ?? 'member',
      })
      mapErr = error
    }
    if (mapErr) {
      console.error('❌ Erreur association:', mapErr)
      const msg = String(mapErr.message || '')
      const looksLikeMissingRole = msg.includes("'role'") || msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('column')
      if (looksLikeMissingRole) {
        console.log('⚠️ Tentative sans colonne role...')
        const { error: fallbackErr } = await supabase.from('user_companies').insert({
          user_id: userId,
          company_id: companyId,
        })
        if (fallbackErr) {
          console.error('❌ Erreur fallback:', fallbackErr)
          return NextResponse.json({ error: fallbackErr.message }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: mapErr.message }, { status: 500 })
      }
    }

    console.log('✅ Utilisateur créé et associé avec succès')
    return NextResponse.json({ ok: true, userId })
  } catch (e: any) {
    console.error('❌ Erreur globale:', e)
    return NextResponse.json({ error: e.message ?? 'Erreur' }, { status: 500 })
  }
}
