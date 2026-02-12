import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { company_id, customer_id, invoice_number: providedInvoiceNumber, date, total, lines } = await req.json();

    if (!company_id || !customer_id || !date || !lines) {
      return NextResponse.json({ ok: false, error: 'Données invalides' }, { status: 400 });
    }

    // Utiliser serviceRoleClient pour bypass RLS
    const supabase = await createServiceRoleClient();

    let invoice_number = providedInvoiceNumber;
    let invoice: any = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    // Boucle de retry en cas de doublon
    while (!invoice && attempts < MAX_ATTEMPTS) {
      attempts++;
      
      // Générer le numéro de facture si non fourni
      if (!invoice_number || attempts > 1) {
        const { data: generatedNumber, error: rpcError } = await supabase
          .rpc('generate_invoice_number', { p_company_id: company_id });
        
        if (rpcError) {
          console.error('Erreur génération numéro:', rpcError);
          throw new Error('Impossible de générer le numéro de facture');
        }
        
        // Si c'est un retry, on incrémente manuellement pour éviter le même numéro
        if (attempts > 1) {
          const match = generatedNumber.match(/F(\d{4})-(\d+)$/);
          if (match) {
            const year = match[1];
            const num = parseInt(match[2], 10) + attempts - 1;
            invoice_number = `F${year}-${String(num).padStart(3, '0')}`;
          } else {
            invoice_number = generatedNumber;
          }
        } else {
          invoice_number = generatedNumber;
        }
      }

      // Tenter de créer la facture
      const { data: createdInvoice, error: insertError } = await supabase
        .from('invoices')
        .insert([{
          company_id,
          customer_id,
          invoice_number,
          date,
          total,
          paid: 0
        }])
        .select()
        .single();

      if (!insertError) {
        // Succès !
        invoice = createdInvoice;
        break;
      }

      // Si ce n'est pas une erreur de doublon, on arrête
      if (insertError.code !== '23505') {
        console.error('Erreur création facture:', insertError);
        throw insertError;
      }

      // Si c'est une erreur de doublon et qu'on a encore des tentatives, on continue la boucle
      console.log(`Tentative ${attempts}: Numéro ${invoice_number} déjà utilisé, retry...`);
    }

    if (!invoice) {
      throw new Error('Impossible de créer la facture après ' + MAX_ATTEMPTS + ' tentatives');
    }

    // Créer les lignes de facture
    const invoiceLinesDb = lines.map((line: any) => ({
      invoice_id: invoice.id,
      product_id: line.product_id,
      quantity: line.quantity,
      price: line.unit_price ?? 0
    }));

    const { error: linesError } = await supabase
      .from('invoice_lines')
      .insert(invoiceLinesDb);

    if (linesError) {
      console.error('Erreur création lignes facture:', linesError);
      throw linesError;
    }

    // NOTE: Le décompte du stock est géré AVANT la création des factures
    // dans InvoiceModal.tsx pour éviter les décomptes multiples en cas de split

    return NextResponse.json({ ok: true, invoice });
  } catch (err: any) {
    console.error('Erreur création facture:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
