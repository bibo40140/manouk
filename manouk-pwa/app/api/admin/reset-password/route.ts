import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Récupérer l'email de l'utilisateur
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(userId)
    if (userErr || !userData?.user?.email) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Envoyer un email de réinitialisation de mot de passe
    const { error: resetErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email,
    })

    if (resetErr) {
      return NextResponse.json({ error: resetErr.message }, { status: 500 })
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Email de réinitialisation envoyé à ${userData.user.email}` 
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
