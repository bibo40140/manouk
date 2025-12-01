import { NextRequest, NextResponse } from 'next/server';
import { createTransport } from 'nodemailer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';



// Générateur PDF avancé, marges, logo, blocs complets, tableau aligné, totaux encadrés, pied de page élégant
async function generateInvoicePDF({ company, customer, invoice, lines }: any) {

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const left = 40, right = 555, width = right - left;
  let y = 792;

  // Couleurs
  const primary = rgb(0.13, 0.36, 0.62); // bleu doux
  const lightBg = rgb(0.96, 0.98, 1);
  const tableHeader = rgb(0.85, 0.91, 0.98);
  const tableBorder = rgb(0.7,0.7,0.7);
  const legalColor = rgb(0.4,0.4,0.4);


  // --- EN-TÊTE ---
  // Logo à gauche, titre à droite
  let headerHeight = 60;
  let logoWidth = 80, logoHeight = 50;
  let logoDrawn = false;
  if (company.logo) {
    try {
      const logoUrl = company.logo;
      const res = await fetch(logoUrl);
      const imgBytes = await res.arrayBuffer();
      const ext = logoUrl.split('.').pop()?.toLowerCase();
      let img;
      if (ext === 'png') img = await pdfDoc.embedPng(imgBytes);
      else img = await pdfDoc.embedJpg(imgBytes);
      page.drawImage(img, { x: left, y: y - logoHeight + 10, width: logoWidth, height: logoHeight });
      logoDrawn = true;
    } catch (e) {}
  }

  // Titre à droite du logo
  const titleX = left + logoWidth + 20;
  page.drawText('FACTURE', { x: titleX, y: y - 5, size: 28, font: boldFont, color: primary });

  // Infos société sous le titre, bien espacées
  let ySoc = y - 35;
  page.drawText(company.name || '', { x: titleX, y: ySoc, size: 13, font: boldFont, color: primary }); ySoc -= 13;
  if (company.address) { page.drawText(company.address, { x: titleX, y: ySoc, size: 10, font }); ySoc -= 12; }
  if (company.siret) { page.drawText('SIRET : ' + company.siret, { x: titleX, y: ySoc, size: 10, font }); ySoc -= 12; }
  if (company.vat_number) { page.drawText('TVA : ' + company.vat_number, { x: titleX, y: ySoc, size: 10, font }); ySoc -= 12; }
  if (company.phone) { page.drawText('Tél : ' + company.phone, { x: titleX, y: ySoc, size: 10, font }); ySoc -= 12; }
  if (company.email) { page.drawText(company.email, { x: titleX, y: ySoc, size: 10, font }); ySoc -= 12; }
  if (company.website) { page.drawText(company.website, { x: titleX, y: ySoc, size: 10, font }); ySoc -= 12; }

  // Date et numéro à droite, alignés
  let yFact = y - 5;
  const factX = right - 160;
  page.drawText(`Facture n°${invoice.invoice_number}`, { x: factX, y: yFact, size: 12, font: boldFont }); yFact -= 16;
  page.drawText(`Date : ${invoice.date}`, { x: factX, y: yFact, size: 12, font });

  // Calculer le y de départ du bloc client (le plus bas des blocs précédents)
  y = Math.min(ySoc, yFact) - 25;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: tableBorder });
  y -= 18;

  // Bloc client (gauche)
  let yCli = y;
  page.drawText('Facturé à :', { x: left, y: yCli, size: 11, font: boldFont, color: rgb(0.2,0.2,0.2) }); yCli -= 13;
  page.drawText(customer.name || '', { x: left, y: yCli, size: 12, font: boldFont }); yCli -= 13;
  if (customer.address) { page.drawText(customer.address, { x: left, y: yCli, size: 10, font }); yCli -= 11; }
  if (customer.phone) { page.drawText('Tél : ' + customer.phone, { x: left, y: yCli, size: 10, font }); yCli -= 11; }
  if (customer.email) { page.drawText(customer.email, { x: left, y: yCli, size: 10, font }); yCli -= 11; }
  y = yCli - 18;

  // Tableau produits
  // En-tête tableau
  page.drawRectangle({ x: left, y, width: width, height: 22, color: tableHeader });
  page.drawText('DESCRIPTION', { x: left + 8, y: y + 7, size: 10, font: boldFont, color: primary });
  page.drawText('PRIX', { x: left + 220, y: y + 7, size: 10, font: boldFont, color: primary });
  page.drawText('QUANTITÉ', { x: left + 320, y: y + 7, size: 10, font: boldFont, color: primary });
  page.drawText('TOTAL', { x: left + 420, y: y + 7, size: 10, font: boldFont, color: primary });
  y -= 22;

  // Lignes produits (alternance gris/blanc)
  lines.forEach((line: any, idx: number) => {
    page.drawRectangle({ x: left, y, width: width, height: 18, color: idx % 2 === 0 ? lightBg : rgb(1,1,1) });
    page.drawText(line.product_name || '', { x: left + 8, y: y + 5, size: 10, font });
    page.drawText((line.unit_price ?? line.price ?? 0).toFixed(2) + ' €', { x: left + 220, y: y + 5, size: 10, font });
    page.drawText(String(line.quantity), { x: left + 340, y: y + 5, size: 10, font });
    page.drawText((line.total ?? ((line.unit_price ?? line.price ?? 0) * (line.quantity ?? 1))).toFixed(2) + ' €', { x: left + 420, y: y + 5, size: 10, font });
    y -= 18;
  });

  // Totaux encadrés à droite
  y -= 10;
    const sousTotal = lines.reduce((sum: number, l: any) => sum + (l.total ?? ((l.unit_price ?? l.price ?? 0) * (l.quantity ?? 1))), 0);
  const tva = 0; // À adapter si TVA
  const total = invoice.total;
  // Sous-total
  page.drawText('Sous total :', { x: left + 340, y, size: 11, font: boldFont });
  page.drawText(sousTotal.toFixed(2) + ' €', { x: left + 440, y, size: 11, font: boldFont });
  y -= 16;
  // TVA
  page.drawText('TVA (0%) :', { x: left + 340, y, size: 11, font: boldFont });
  page.drawText(tva.toFixed(2) + ' €', { x: left + 440, y, size: 11, font: boldFont });
  y -= 16;
  // Encadré total
  page.drawRectangle({ x: left + 340, y: y - 2, width: 155, height: 18, color: primary });
  page.drawText('TOTAL :', { x: left + 345, y: y + 3, size: 12, font: boldFont, color: rgb(1,1,1) });
  page.drawText(total.toFixed(2) + ' €', { x: left + 440, y: y + 3, size: 12, font: boldFont, color: rgb(1,1,1) });
  y -= 30;

  // Mentions légales (bas de page, toute largeur)
  let yLegal = 80;
  if (company.legal_notice) {
    page.drawRectangle({ x: left, y: yLegal, width: width, height: 30, color: rgb(1,1,1) });
    page.drawText(company.legal_notice, { x: left + 5, y: yLegal + 18, size: 9, font, color: legalColor, maxWidth: width - 10 });
    yLegal -= 10;
  }

  // Pied de page (RIB, conditions, remerciement)
  let yFooter = 50;
  if (company.rib) {
    page.drawText('RIB : ' + company.rib, { x: left, y: yFooter, size: 9, font });
    yFooter -= 12;
  }
  page.drawText('Conditions de paiement : Paiement sous 30 jours', { x: left, y: yFooter, size: 9, font });
  page.drawText('MERCI DE VOTRE CONFIANCE', { x: right - 180, y: yFooter, size: 10, font: boldFont, color: primary });

  // Correction : retourner explicitement le PDF généré
  return await pdfDoc.save();
}


// Nouvelle version : accepte un tableau de factures, un destinataire, un texte personnalisé
export async function POST(req: NextRequest) {
  try {
    const { invoices, to, subject, text } = await req.json();
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json({ ok: false, error: 'Aucune facture à envoyer.' }, { status: 400 });
    }

    // Récupérer la config SMTP depuis Supabase
    let transporter;
    let smtp: any = {};
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']);
      if (error) throw error;
      data?.forEach((row: any) => {
        smtp[row.key.replace('smtp_', '')] = row.value;
      });
      if (!smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
        throw new Error('Configuration SMTP incomplète');
      }
      transporter = createTransport({
        host: smtp.host,
        port: Number(smtp.port),
        secure: false,
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
      });
    } catch (err) {
      return NextResponse.json({ ok: false, error: 'Erreur config SMTP', details: String(err) }, { status: 500 });
    }

    // Générer tous les PDFs
    const attachments = [];
    for (const inv of invoices) {
      try {
        const pdfBytes: Uint8Array = await generateInvoicePDF(inv);
        if (!pdfBytes || typeof pdfBytes.length !== 'number') {
          return NextResponse.json({ ok: false, error: 'Erreur génération PDF', details: 'PDF non généré ou format incorrect' }, { status: 500 });
        }
        attachments.push({
          filename: `Facture-${inv.invoice.invoice_number}.pdf`,
          content: Buffer.from(pdfBytes),
          contentType: 'application/pdf',
        });
      } catch (err) {
        return NextResponse.json({ ok: false, error: 'Erreur génération PDF', details: String(err) }, { status: 500 });
      }
    }

    // Envoyer l'email avec toutes les factures en PJ
    try {
      const info = await transporter.sendMail({
        from: smtp.from ? `${smtp.from} <${smtp.user}>` : smtp.user,
        to,
        subject: subject || 'Vos factures',
        text: text || 'Bonjour,\n\nVeuillez trouver vos factures en pièce jointe.\n\nCordialement.',
        attachments,
      });
      // Marquer chaque facture comme envoyée
      try {
        const supabase = await createClient();
        for (const inv of invoices) {
          if (inv.invoice?.id) {
            await supabase.from('invoices').update({ email_sent: true, email_sent_date: new Date().toISOString().slice(0,10) }).eq('id', inv.invoice.id);
          }
        }
      } catch (e) { /* ignore erreur update */ }
      return NextResponse.json({ ok: true, info });
    } catch (err) {
      return NextResponse.json({ ok: false, error: 'Erreur envoi mail', details: String(err) }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Erreur générale', details: String(err) }, { status: 500 });
  }
}
