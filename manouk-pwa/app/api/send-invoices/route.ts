import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoices, to, subject, text } = body;
    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json({ error: 'Paramètres manquants: invoices' }, { status: 400 });
    }

    // Récupérer SMTP depuis Supabase settings
    const supabase = await createClient();
    const smtp: any = {};
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']);
    if (settingsError) {
      return NextResponse.json({ error: 'Erreur config SMTP', details: settingsError.message }, { status: 500 });
    }
    settings?.forEach((row: any) => { smtp[row.key.replace('smtp_', '')] = row.value; });
    if (!smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
      return NextResponse.json({ error: 'Configuration SMTP incomplète' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port),
      secure: false,
      auth: { user: smtp.user, pass: smtp.pass },
    });
    const results = [];

    for (const inv of invoices) {
      const mailTo = to || inv.to;
      const mailSubject = subject || inv.subject || `Votre facture ${inv.invoice?.invoice_number || ''}`;
      const mailText = text || inv.text || `Bonjour,\nVeuillez trouver votre facture en pièce jointe.`;
      const html = inv.html;
      const attachments = inv.attachments || [];
      const info = await transporter.sendMail({
        from: smtp.from ? `${smtp.from} <${smtp.user}>` : smtp.user,
        to: mailTo,
        subject: mailSubject,
        text: mailText,
        html,
        attachments,
      });
      results.push({ invoiceId: inv.id, messageId: info.messageId });
      // Marquer la facture comme envoyée
      if (inv.id) {
        await supabase.from('invoices').update({ email_sent: true, email_sent_date: new Date().toISOString().slice(0,10) }).eq('id', inv.id);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
