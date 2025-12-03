import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, companyId, role } = body as { email: string; password?: string; companyId: string; role?: string }
    if (!email || !companyId) {
      return NextResponse.json({ error: 'email et companyId requis' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    // Create user with password if provided, otherwise invite
    let userId: string | undefined
    if (password) {
      const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })
      if (userErr) {
        return NextResponse.json({ error: userErr.message }, { status: 500 })
      }
      userId = userData?.user?.id
    } else {
      const { data: userData, error: userErr } = await supabase.auth.admin.inviteUserByEmail(email)
      if (userErr) {
        return NextResponse.json({ error: userErr.message }, { status: 500 })
      }
      userId = userData?.user?.id
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Création utilisateur échouée' }, { status: 500 })
    }

    // Map user to company (handle old schema without 'role' column)
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
      const msg = String(mapErr.message || '')
      const looksLikeMissingRole = msg.includes("'role'") || msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('column')
      if (looksLikeMissingRole) {
        const { error: fallbackErr } = await supabase.from('user_companies').insert({
          user_id: userId,
          company_id: companyId,
        })
        if (fallbackErr) {
          return NextResponse.json({ error: fallbackErr.message }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: mapErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, userId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur' }, { status: 500 })
  }
}
