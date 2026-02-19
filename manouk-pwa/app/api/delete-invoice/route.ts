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
      .select('product_id, quantity, delivery_id')
      .eq('invoice_id', id);

    if (linesError) {
      return NextResponse.json({ error: 'Fetch lines failed: ' + linesError.message }, { status: 500 });
    }

    const deliveryIds = new Set<string>();

    if (lines && lines.length) {
      for (const line of lines) {
        if (line.delivery_id) {
          deliveryIds.add(line.delivery_id);
          continue;
        }
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

    // Supprimer la facture (cascade supprime lignes & paiements si FK definis ainsi)
    const { error: deleteError } = await supabase.from('invoices').delete().eq('id', id);
    if (deleteError) {
      return NextResponse.json({ error: 'Delete invoice failed: ' + deleteError.message }, { status: 500 });
    }

    for (const deliveryId of deliveryIds) {
      const { count } = await supabase
        .from('invoice_lines')
        .select('id', { count: 'exact', head: true })
        .eq('delivery_id', deliveryId);

      if (!count || count === 0) {
        await supabase
          .from('deliveries')
          .update({ invoiced_at: null })
          .eq('id', deliveryId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}
