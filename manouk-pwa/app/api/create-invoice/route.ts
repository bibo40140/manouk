import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { customerId, invoiceDate, mailBody, lines, companies } = await req.json();

    if (!customerId || !lines || lines.length === 0) {
      return NextResponse.json({ ok: false, error: 'Données invalides' }, { status: 400 });
    }

    // Utiliser serviceRoleClient pour bypass RLS
    const supabase = await createServiceRoleClient();

    // Regrouper les lignes par société selon la répartition (splits)
    const companyMap: Record<string, { total: number, lines: any[] }> = {};

    lines.forEach((line: any) => {
      (line.splits || []).forEach((split: any) => {
        if (!split.amount || split.amount <= 0) return;
        if (!companyMap[split.company_id]) companyMap[split.company_id] = { total: 0, lines: [] };
        companyMap[split.company_id].lines.push({
          product_id: line.product_id,
          product_name: line.product_name,
          quantity: line.quantity,
          unit_price: split.amount,
          total: split.amount * line.quantity
        });
        companyMap[split.company_id].total += split.amount * line.quantity;
      });
    });

    // Créer une facture par société
    const invoicesToSend: any[] = [];

    for (const [company_id, { total, lines: companyLines }] of Object.entries(companyMap)) {
      // Génère le numéro de facture pour chaque société
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('company_id', company_id)
        .order('date', { ascending: false });

      const firstInvoice = Array.isArray(lastInvoice) ? lastInvoice[0] : lastInvoice;
      let nextNum = 1;
      if (firstInvoice?.invoice_number) {
        const match = firstInvoice.invoice_number.match(/(\d+)$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      const year = new Date().getFullYear();
      const autoInvoiceNumber = `F${year}-${String(nextNum).padStart(3, '0')}`;

      // Créer la facture
      const { data: invoice, error: insertError } = await supabase
        .from('invoices')
        .insert([{
          company_id,
          customer_id: customerId,
          invoice_number: autoInvoiceNumber,
          date: invoiceDate,
          total,
          paid: 0
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Créer les lignes de facture
      const invoiceLinesDb = companyLines.map((line: any) => ({
        invoice_id: invoice.id,
        product_id: line.product_id,
        quantity: line.quantity,
        price: line.unit_price ?? 0
      }));

      const { error: linesError } = await supabase
        .from('invoice_lines')
        .insert(invoiceLinesDb);

      if (linesError) throw linesError;

      // Récupérer les infos complètes pour l'email
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company_id)
        .single();

      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      invoicesToSend.push({ company, customer, invoice, lines: companyLines });
    }

    // Envoyer les factures par email
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    await fetch(`${req.nextUrl.origin}/api/send-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoices: invoicesToSend,
        to: customer?.email || '',
        subject: `Vos factures ${customer?.name || ''}`,
        text: mailBody
      })
    });

    return NextResponse.json({ ok: true, invoices: invoicesToSend.length });
  } catch (err: any) {
    console.error('Erreur création facture:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
