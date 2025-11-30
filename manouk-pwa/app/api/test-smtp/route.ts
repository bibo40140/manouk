import { NextRequest, NextResponse } from 'next/server';
import { createTransport } from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { host, port, user, pass, from, to } = await req.json();
    if (!host || !port || !user || !pass || !to) {
      return NextResponse.json({ ok: false, error: 'Champs requis manquants.' }, { status: 400 });
    }
    const transporter = createTransport({
      host,
      port: Number(port),
      secure: false,
      auth: { user, pass },
    });
    const info = await transporter.sendMail({
      from: from ? `${from} <${user}>` : user,
      to,
      subject: 'Test SMTP Manouk',
      text: 'Ceci est un mail de test envoyé depuis la configuration SMTP de Manouk.',
    });
    return NextResponse.json({ ok: true, info });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message, details: String(err) }, { status: 500 });
  }
}
