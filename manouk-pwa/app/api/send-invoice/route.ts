import { NextRequest, NextResponse } from 'next/server';
import { createTransport } from 'nodemailer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createServiceRoleClient } from '@/lib/supabase/server';



// Générateur PDF professionnel avec toutes les informations de la société
async function generateInvoicePDF({ company, customer, invoice, lines }: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const margin = 50;
  const pageWidth = 595;
  const pageHeight = 842;
  const contentWidth = pageWidth - (margin * 2);
  
  let y = pageHeight - margin;

  // Couleurs modernes - Bleu Manouk
  const primaryColor = rgb(0.2, 0.4, 0.7); // Bleu professionnel
  const secondaryColor = rgb(0.95, 0.95, 0.95); // Gris clair
  const accentColor = rgb(0.3, 0.5, 0.8); // Bleu vif
  const textColor = rgb(0.2, 0.2, 0.2);
  const borderColor = rgb(0.8, 0.8, 0.8);

  // === HEADER AVEC LOGO ===
  let logoHeight = 0;
  const logoUrl = company.logo_url || company.logo;
  
  console.log('🖼️ Tentative chargement logo:', logoUrl);
  
  if (logoUrl) {
    try {
      console.log('🖼️ Téléchargement du logo depuis:', logoUrl);
      const res = await fetch(logoUrl);
      
      if (!res.ok) {
        console.error('🖼️ Erreur HTTP lors du téléchargement:', res.status, res.statusText);
        throw new Error(`HTTP ${res.status}`);
      }
      
      const imgBytes = await res.arrayBuffer();
      console.log('🖼️ Logo téléchargé, taille:', imgBytes.byteLength, 'bytes');
      
      const ext = logoUrl.split('.').pop()?.toLowerCase();
      console.log('🖼️ Extension détectée:', ext);
      
      let img;
      
      if (ext === 'png') img = await pdfDoc.embedPng(imgBytes);
      else if (ext === 'jpg' || ext === 'jpeg') img = await pdfDoc.embedJpg(imgBytes);
      else {
        console.error('🖼️ Format non supporté:', ext);
        throw new Error('Format non supporté');
      }
      
      if (img) {
        const imgDims = img.scale(0.3);
        const maxLogoHeight = 80;
        const maxLogoWidth = 150;
        
        let width = imgDims.width;
        let height = imgDims.height;
        
        if (height > maxLogoHeight) {
          width = width * (maxLogoHeight / height);
          height = maxLogoHeight;
        }
        if (width > maxLogoWidth) {
          height = height * (maxLogoWidth / width);
          width = maxLogoWidth;
        }
        
        console.log('🖼️ Logo intégré au PDF, dimensions:', width, 'x', height);
        
        page.drawImage(img, { 
          x: margin, 
          y: y - height, 
          width, 
          height 
        });
        logoHeight = height;
      }
    } catch (e) {
      console.error('🖼️ Erreur chargement logo:', e);
    }
  } else {
    console.log('🖼️ Aucun logo configuré pour cette société');
  }

  // Bloc société (en haut à droite)
  const companyBlockX = pageWidth - margin - 200;
  let yCompany = y;
  
  page.drawText(company.name || 'SOCIÉTÉ', { 
    x: companyBlockX, 
    y: yCompany, 
    size: 12, 
    font: boldFont, 
    color: primaryColor 
  });
  yCompany -= 15;
  
  if (company.address) {
    const addressLines = company.address.split('\n');
    addressLines.forEach((line: string) => {
      page.drawText(line, { x: companyBlockX, y: yCompany, size: 9, font, color: textColor });
      yCompany -= 12;
    });
  }
  
  if (company.siret) {
    page.drawText(`SIRET: ${company.siret}`, { 
      x: companyBlockX, 
      y: yCompany, 
      size: 9, 
      font, 
      color: textColor 
    });
    yCompany -= 12;
  }
  
  if (company.vat_number) {
    page.drawText(`N° TVA: ${company.vat_number}`, { 
      x: companyBlockX, 
      y: yCompany, 
      size: 9, 
      font, 
      color: textColor 
    });
    yCompany -= 12;
  }
  
  if (company.phone) {
    page.drawText(`Tél: ${company.phone}`, { 
      x: companyBlockX, 
      y: yCompany, 
      size: 9, 
      font, 
      color: textColor 
    });
    yCompany -= 12;
  }
  
  if (company.email) {
    page.drawText(company.email, { 
      x: companyBlockX, 
      y: yCompany, 
      size: 9, 
      font, 
      color: accentColor 
    });
    yCompany -= 12;
  }
  
  if (company.website) {
    page.drawText(company.website, { 
      x: companyBlockX, 
      y: yCompany, 
      size: 9, 
      font, 
      color: accentColor 
    });
    yCompany -= 12;
  }

  // Positionner y après le logo ou le bloc société (le plus bas)
  y = Math.min(y - logoHeight, yCompany) - 30;

  // === TITRE FACTURE ===
  page.drawRectangle({
    x: margin,
    y: y - 40,
    width: contentWidth,
    height: 40,
    color: primaryColor
  });
  
  page.drawText('FACTURE', { 
    x: margin + 15, 
    y: y - 25, 
    size: 20, 
    font: boldFont, 
    color: rgb(1, 1, 1) 
  });
  
  page.drawText(`N° ${invoice.invoice_number}`, { 
    x: pageWidth - margin - 120, 
    y: y - 18, 
    size: 11, 
    font: boldFont, 
    color: rgb(1, 1, 1) 
  });
  
  const invoiceDate = new Date(invoice.date).toLocaleDateString('fr-FR');
  page.drawText(`Date: ${invoiceDate}`, { 
    x: pageWidth - margin - 120, 
    y: y - 32, 
    size: 10, 
    font, 
    color: rgb(1, 1, 1) 
  });
  
  y -= 60;

  // === INFORMATIONS CLIENT ===
  page.drawRectangle({
    x: margin,
    y: y - 90,
    width: contentWidth / 2 - 10,
    height: 90,
    borderColor: borderColor,
    borderWidth: 1
  });
  
  page.drawText('FACTURÉ À:', { 
    x: margin + 10, 
    y: y - 15, 
    size: 9, 
    font: boldFont, 
    color: primaryColor 
  });
  
  let yClient = y - 30;
  page.drawText(customer.name || 'Client', { 
    x: margin + 10, 
    y: yClient, 
    size: 11, 
    font: boldFont, 
    color: textColor 
  });
  yClient -= 15;
  
  if (customer.address) {
    const custAddressLines = customer.address.split('\n').slice(0, 2);
    custAddressLines.forEach((line: string) => {
      page.drawText(line, { x: margin + 10, y: yClient, size: 9, font, color: textColor });
      yClient -= 12;
    });
  }
  
  if (customer.phone) {
    page.drawText(`Tél: ${customer.phone}`, { 
      x: margin + 10, 
      y: yClient, 
      size: 9, 
      font, 
      color: textColor 
    });
    yClient -= 12;
  }
  
  if (customer.email) {
    page.drawText(customer.email, { 
      x: margin + 10, 
      y: yClient, 
      size: 9, 
      font, 
      color: accentColor 
    });
  }

  y -= 110;

  // === TABLEAU DES PRODUITS ===
  // En-tête
  page.drawRectangle({
    x: margin,
    y: y - 25,
    width: contentWidth,
    height: 25,
    color: secondaryColor
  });
  
  page.drawText('DESCRIPTION', { 
    x: margin + 10, 
    y: y - 17, 
    size: 10, 
    font: boldFont, 
    color: textColor 
  });
  page.drawText('QTÉ', { 
    x: margin + 310, 
    y: y - 17, 
    size: 10, 
    font: boldFont, 
    color: textColor 
  });
  page.drawText('PRIX U.', { 
    x: margin + 360, 
    y: y - 17, 
    size: 10, 
    font: boldFont, 
    color: textColor 
  });
  page.drawText('TOTAL', { 
    x: margin + 430, 
    y: y - 17, 
    size: 10, 
    font: boldFont, 
    color: textColor 
  });
  
  y -= 25;
  
  // Lignes de produits
  lines.forEach((line: any, idx: number) => {
    const rowHeight = 22;
    
    if (idx % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98)
      });
    }
    
    const productName = line.product_name || 'Produit';
    page.drawText(productName, { 
      x: margin + 10, 
      y: y - 15, 
      size: 10, 
      font, 
      color: textColor,
      maxWidth: 280
    });
    
    const quantity = String(line.quantity || 1);
    page.drawText(quantity, { 
      x: margin + 320, 
      y: y - 15, 
      size: 10, 
      font, 
      color: textColor 
    });
    
    const unitPrice = (line.unit_price ?? line.price ?? 0).toFixed(2) + ' €';
    page.drawText(unitPrice, { 
      x: margin + 365, 
      y: y - 15, 
      size: 10, 
      font, 
      color: textColor 
    });
    
    const total = (line.total ?? ((line.unit_price ?? line.price ?? 0) * (line.quantity ?? 1))).toFixed(2) + ' €';
    page.drawText(total, { 
      x: margin + 435, 
      y: y - 15, 
      size: 10, 
      font, 
      color: textColor 
    });
    
    y -= rowHeight;
  });

  // Ligne de séparation
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: pageWidth - margin, y: y },
    thickness: 1,
    color: borderColor
  });
  
  y -= 40;

  // === TOTAUX ===
  const totalAmount = invoice.total || 0;
  const tvaAmount = 0; // TVA si applicable
  
  const totalsX = pageWidth - margin - 180;
  
  // Sous-total
  page.drawText('Sous-total HT:', { 
    x: totalsX, 
    y, 
    size: 10, 
    font, 
    color: textColor 
  });
  page.drawText(totalAmount.toFixed(2) + ' €', { 
    x: totalsX + 100, 
    y, 
    size: 10, 
    font: boldFont, 
    color: textColor 
  });
  y -= 18;
  
  // TVA
  page.drawText('TVA (0%):', { 
    x: totalsX, 
    y, 
    size: 10, 
    font, 
    color: textColor 
  });
  page.drawText(tvaAmount.toFixed(2) + ' €', { 
    x: totalsX + 100, 
    y, 
    size: 10, 
    font: boldFont, 
    color: textColor 
  });
  y -= 30;
  
  // Total TTC
  page.drawRectangle({
    x: totalsX - 10,
    y: y - 5,
    width: 180,
    height: 30,
    color: primaryColor
  });
  
  page.drawText('TOTAL TTC:', { 
    x: totalsX, 
    y: y + 7, 
    size: 12, 
    font: boldFont, 
    color: rgb(1, 1, 1) 
  });
  page.drawText(totalAmount.toFixed(2) + ' €', { 
    x: totalsX + 100, 
    y: y + 7, 
    size: 12, 
    font: boldFont, 
    color: rgb(1, 1, 1) 
  });

  // === BAS DE PAGE ===
  let yFooter = 120;
  
  // Mentions légales
  if (company.legal_notice) {
    page.drawRectangle({
      x: margin,
      y: yFooter - 35,
      width: contentWidth,
      height: 35,
      color: rgb(0.97, 0.97, 0.97)
    });
    
    page.drawText('Mentions légales:', { 
      x: margin + 10, 
      y: yFooter - 15, 
      size: 8, 
      font: boldFont, 
      color: textColor 
    });
    
    const legalText = company.legal_notice.substring(0, 200);
    const legalLines = legalText.match(/.{1,90}/g) || [legalText];
    let yLegal = yFooter - 27;
    
    legalLines.slice(0, 2).forEach((line: string) => {
      page.drawText(line, { 
        x: margin + 10, 
        y: yLegal, 
        size: 7, 
        font, 
        color: rgb(0.4, 0.4, 0.4) 
      });
      yLegal -= 9;
    });
    
    yFooter -= 45;
  }
  
  // Informations de paiement
  page.drawText('Conditions de paiement:', { 
    x: margin, 
    y: yFooter, 
    size: 9, 
    font: boldFont, 
    color: textColor 
  });
  yFooter -= 25;
  
  // Message de remerciement
  page.drawText('Merci de votre confiance !', { 
    x: pageWidth - margin - 150, 
    y: 60, 
    size: 10, 
    font: boldFont, 
    color: primaryColor 
  });
  
  // Numéro de page
  page.drawText('Page 1/1', { 
    x: pageWidth / 2 - 20, 
    y: 30, 
    size: 8, 
    font, 
    color: rgb(0.6, 0.6, 0.6) 
  });

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
      const supabase = await createServiceRoleClient();
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

    // Enrichir les données des sociétés depuis la base de données
    // ⚠️ Utiliser serviceRoleClient pour bypass RLS et charger TOUTES les sociétés
    const supabase = await createServiceRoleClient();
    const enrichedInvoices = [];
    
    for (const inv of invoices) {
      // Charger TOUTES les données de la société depuis la DB
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, code, email, address, siret, vat_number, phone, website, legal_notice, logo_url')
        .eq('id', inv.company?.id || inv.invoice?.company_id)
        .single();
      
      if (companyError) {
        console.error('Erreur chargement société:', companyError);
      }
      
      enrichedInvoices.push({
        ...inv,
        company: companyData || inv.company
      });
      
      console.log('📄 Données société pour PDF:', companyData);
    }

    // Générer tous les PDFs
    const attachments = [];
    for (const inv of enrichedInvoices) {
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
        for (const inv of enrichedInvoices) {
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
