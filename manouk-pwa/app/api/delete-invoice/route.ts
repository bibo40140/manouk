import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Supprime une facture : restaure le stock des produits concernés puis supprime la facture.
// Les lignes et paiements liés sont supprimés automatiquement si les FK ont ON DELETE CASCADE.
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 });
    }

    // IMPORTANT: createClient est async -> il faut await
    const supabase = await createClient();

    // Récupérer les lignes pour restaurer le stock des produits
    const { data: lines, error: linesError } = await supabase
      .from('invoice_lines')
      .select('product_id, quantity')
      .eq('invoice_id', id);

    if (linesError) {
      return NextResponse.json({ error: 'Fetch lines failed: ' + linesError.message }, { status: 500 });
    }

    if (lines && lines.length) {
      for (const line of lines) {
        if (!line.product_id || !line.quantity) continue;
        // Lire stock courant
        const { data: productRow, error: prodErr } = await supabase
          .from('products')
          .select('stock')
          .eq('id', line.product_id)
          .single();
        if (prodErr) {
          return NextResponse.json({ error: 'Fetch product failed: ' + prodErr.message }, { status: 500 });
        }
        const newStock = (productRow?.stock || 0) + line.quantity;
        const { error: updErr } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', line.product_id);
        if (updErr) {
          return NextResponse.json({ error: 'Update stock failed: ' + updErr.message }, { status: 500 });
        }
      }
    }

    // Supprimer la facture (cascade supprime lignes & paiements si FK définis ainsi)
    const { error: deleteError } = await supabase.from('invoices').delete().eq('id', id);
    if (deleteError) {
      return NextResponse.json({ error: 'Delete invoice failed: ' + deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}
