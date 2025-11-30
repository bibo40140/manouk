import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { smtpConfig, invoices } = body;
    if (!smtpConfig || !invoices || !Array.isArray(invoices)) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport(smtpConfig);
    const results = [];

    for (const invoice of invoices) {
      const { to, subject, text, html, attachments } = invoice;
      const info = await transporter.sendMail({
        from: smtpConfig.auth.user,
        to,
        subject,
        text,
        html,
        attachments,
      });
      results.push({ invoiceId: invoice.id, messageId: info.messageId });
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
