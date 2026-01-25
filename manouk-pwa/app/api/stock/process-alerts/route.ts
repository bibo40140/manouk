import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const supabase = createServiceRoleClient()

    // Récupérer toutes les alertes non envoyées
    const { data: alerts, error: alertsError } = await supabase
      .from('stock_alerts')
      .select(`
        *,
        companies (
          name,
          email
        )
      `)
      .eq('email_sent', false)

    if (alertsError) throw alertsError

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ message: 'Aucune alerte en attente', sent: 0 })
    }

    // Créer le transporteur email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    let sentCount = 0

    // Envoyer un email pour chaque alerte
    for (const alert of alerts) {
      const company = alert.companies as any
      if (!company?.email) continue

      const subject = `⚠️ Alerte Stock : ${alert.item_name}`
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .stock-info { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; border: 1px solid #ddd; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Alerte Stock Automatique</h1>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>Attention :</strong> Le stock de <strong>${alert.item_name}</strong> est faible !
              </div>
              
              <div class="stock-info">
                <h3 style="margin-top: 0;">Détails</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Article :</strong> ${alert.item_name}</li>
                  <li><strong>Type :</strong> ${alert.item_type === 'raw_material' ? 'Matière première' : 'Produit'}</li>
                  <li><strong>Stock actuel :</strong> ${alert.current_stock}</li>
                  <li><strong>Seuil d'alerte :</strong> ${alert.alert_threshold}</li>
                  <li><strong>Société :</strong> ${company.name}</li>
                </ul>
              </div>
              
              <p>Il est recommandé de réapprovisionner cet article rapidement pour éviter toute rupture de stock.</p>
              
              <div class="footer">
                <p>Cet email a été envoyé automatiquement par le système de gestion Manouk.</p>
                <p>Date : ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      try {
        await transporter.sendMail({
          from: `"Manouk - Alerte Stock" <${process.env.SMTP_USER}>`,
          to: company.email,
          subject,
          html,
        })

        // Marquer l'alerte comme envoyée
        await supabase
          .from('stock_alerts')
          .update({ email_sent: true })
          .eq('id', alert.id)

        sentCount++
      } catch (emailError) {
        console.error('Erreur envoi email pour alerte', alert.id, emailError)
      }
    }

    return NextResponse.json({ 
      message: `${sentCount} alertes envoyées sur ${alerts.length}`,
      sent: sentCount,
      total: alerts.length
    })
  } catch (e: any) {
    console.error('Erreur traitement alertes:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
