import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Générateur PDF (réutilisation du même code que send-invoice)
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
  const primaryColor = rgb(0.2, 0.4, 0.7);
  const secondaryColor = rgb(0.95, 0.95, 0.95);
  const accentColor = rgb(0.3, 0.5, 0.8);
  const textColor = rgb(0.2, 0.2, 0.2);
  const borderColor = rgb(0.8, 0.8, 0.8);

  // === HEADER AVEC LOGO ===
  let logoHeight = 0;
  const logoUrl = company.logo_url || company.logo;
  
  if (logoUrl) {
    try {
      const res = await fetch(logoUrl);
      if (res.ok) {
        const imgBytes = await res.arrayBuffer();
        const ext = logoUrl.split('.').pop()?.toLowerCase();
        
        let img;
        if (ext === 'png') img = await pdfDoc.embedPng(imgBytes);
        else if (ext === 'jpg' || ext === 'jpeg') img = await pdfDoc.embedJpg(imgBytes);
        
        if (img) {
          const imgDims = img.scale(0.3);
          const maxLogoHeight = 80;
          const scale = Math.min(1, maxLogoHeight / imgDims.height);
          const logoW = imgDims.width * scale;
          const logoH = imgDims.height * scale;
          logoHeight = logoH;
          page.drawImage(img, { x: pageWidth - margin - logoW, y: y - logoH, width: logoW, height: logoH });
        }
      }
    } catch (e) {
      console.error('Erreur logo:', e);
    }
  }

  // === INFORMATIONS SOCIÉTÉ (GAUCHE) ===
  const companyBlockX = margin;
  let yCompany = y;
  
  page.drawText(company.name || 'Société', { 
    x: companyBlockX, 
    y: yCompany, 
    size: 14, 
    font: boldFont, 
    color: primaryColor 
  });
  yCompany -= 20;
  
  if (company.address) {
    const addressLines = company.address.split('\n').slice(0, 3);
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
    page.drawText(`TVA: ${company.vat_number}`, { 
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
    x: margin + 10, 
    y: y - 25, 
    size: 20, 
    font: boldFont, 
    color: rgb(1, 1, 1) 
  });
  
  page.drawText(`N° ${invoice.invoice_number}`, { 
    x: pageWidth - margin - 120, 
    y: y - 25, 
    size: 14, 
    font: boldFont, 
    color: rgb(1, 1, 1) 
  });

  y -= 70;

  // === DATE ET CLIENT ===
  page.drawText(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, { 
    x: pageWidth - margin - 150, 
    y: y, 
    size: 10, 
    font, 
    color: textColor 
  });

  y -= 30;
  
  page.drawRectangle({
    x: margin,
    y: y - 90,
    width: 250,
    height: 90,
    borderColor: borderColor,
    borderWidth: 1
  });
  
  page.drawText('CLIENT', { 
    x: margin + 10, 
    y: y - 15, 
    size: 10, 
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
  page.drawRectangle({
    x: margin,
    y: y - 25,
    width: contentWidth,
    height: 25,
    color: secondaryColor
  });
  
  page.drawText('DESCRIPTION', { x: margin + 10, y: y - 17, size: 10, font: boldFont, color: textColor });
  page.drawText('QTÉ', { x: pageWidth - 250, y: y - 17, size: 10, font: boldFont, color: textColor });
  page.drawText('P.U. HT', { x: pageWidth - 180, y: y - 17, size: 10, font: boldFont, color: textColor });
  page.drawText('TOTAL HT', { x: pageWidth - 100, y: y - 17, size: 10, font: boldFont, color: textColor });

  y -= 25;

  const formatEuro = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  for (const line of lines) {
    y -= 25;
    page.drawText(line.product_name || 'Produit', { x: margin + 10, y, size: 9, font, color: textColor });
    page.drawText(String(line.quantity || 0), { x: pageWidth - 250, y, size: 9, font, color: textColor });
    page.drawText(formatEuro(Number(line.unit_price || 0)), { x: pageWidth - 180, y, size: 9, font, color: textColor });
    page.drawText(formatEuro(Number(line.total || 0)), { x: pageWidth - 100, y, size: 9, font, color: textColor });
    
    page.drawLine({
      start: { x: margin, y: y - 5 },
      end: { x: pageWidth - margin, y: y - 5 },
      color: borderColor,
      thickness: 0.5
    });
  }

  y -= 40;

  // === TOTAL ===
  const totalHT = Number(invoice.total || 0);
  
  page.drawRectangle({
    x: pageWidth - margin - 200,
    y: y - 30,
    width: 200,
    height: 30,
    color: primaryColor
  });
  
  page.drawText('TOTAL HT:', { 
    x: pageWidth - margin - 190, 
    y: y - 20, 
    size: 12, 
    font: boldFont, 
    color: rgb(1, 1, 1) 
  });
  
  page.drawText(formatEuro(totalHT), { 
    x: pageWidth - margin - 90, 
    y: y - 20, 
    size: 12, 
    font: boldFont, 
    color: rgb(1, 1, 1) 
  });

  y -= 60;

  // === MENTIONS LÉGALES ===
  if (company.legal_notice) {
    const legalLines = company.legal_notice.split('\n').slice(0, 5);
    let yLegal = y;
    
    page.drawText('Mentions légales:', { 
      x: margin, 
      y: yLegal, 
      size: 9, 
      font: boldFont, 
      color: textColor 
    });
    yLegal -= 15;
    
    legalLines.forEach((line: string) => {
      page.drawText(line, { 
        x: margin, 
        y: yLegal, 
        size: 8, 
        font, 
        color: rgb(0.4, 0.4, 0.4) 
      });
      yLegal -= 9;
    });
  }

  // Message de remerciement
  page.drawText('Merci de votre confiance !', { 
    x: pageWidth - margin - 150, 
    y: 60, 
    size: 10, 
    font: boldFont, 
    color: primaryColor 
  });

  return await pdfDoc.save();
}

export async function POST(req: NextRequest) {
  try {
    const { invoiceId } = await req.json();
    
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID manquant' }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    // Charger la facture avec toutes les données
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        company:companies(*),
        customer:customers(*),
        invoice_lines(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    // Enrichir les lignes avec les noms de produits
    const { data: products } = await supabase
      .from('products')
      .select('id, name');

    const enrichedLines = invoice.invoice_lines.map((line: any) => ({
      ...line,
      product_name: products?.find((p: any) => p.id === line.product_id)?.name || 'Produit'
    }));

    // Générer le PDF
    const pdfBytes = await generateInvoicePDF({
      company: invoice.company,
      customer: invoice.customer,
      invoice,
      lines: enrichedLines
    });

    // Retourner le PDF
    const buffer = Buffer.from(pdfBytes);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Facture-${invoice.invoice_number}.pdf"`
      }
    });

  } catch (err: any) {
    console.error('Erreur génération PDF:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
