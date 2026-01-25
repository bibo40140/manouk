import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { companyEmail, itemName, stock, type } = await req.json()

    if (!companyEmail || !itemName) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
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

    // Contenu de l'email
    const subject = `⚠️ Alerte Stock : ${itemName}`
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
            <h1 style="margin: 0;">⚠️ Alerte Stock</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>Attention :</strong> Le stock de <strong>${itemName}</strong> est faible.
            </div>
            
            <div class="stock-info">
              <h3 style="margin-top: 0;">Détails</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Article :</strong> ${itemName}</li>
                <li><strong>Type :</strong> ${type}</li>
                <li><strong>Stock actuel :</strong> ${stock}</li>
              </ul>
            </div>
            
            <p>Il est recommandé de réapprovisionner cet article rapidement pour éviter toute rupture de stock.</p>
            
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par le système de gestion Manouk.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Envoyer l'email
    await transporter.sendMail({
      from: `"Manouk - Gestion Stock" <${process.env.SMTP_USER}>`,
      to: companyEmail,
      subject,
      html,
    })

    return NextResponse.json({ ok: true, message: 'Alerte envoyée' })
  } catch (e: any) {
    console.error('Erreur envoi alerte stock:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
