import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { delivery_id } = await req.json();

    if (!delivery_id) {
      return NextResponse.json({ ok: false, error: 'Delivery id manquant' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 1. Récupérer la livraison et ses productions
    const { data: delivery, error: fetchError } = await supabase
      .from('deliveries')
      .select(`
        id,
        invoiced_at,
        delivery_productions(
          production_id,
          production:productions(id, product_id, quantity, product:products(id, name, stock))
        )
      `)
      .eq('id', delivery_id)
      .single();

    if (fetchError || !delivery) {
      return NextResponse.json({ ok: false, error: 'Livraison introuvable' }, { status: 404 });
    }

    // 2. Vérifier si la livraison est déjà facturée
    if (delivery.invoiced_at) {
      const { count } = await supabase
        .from('invoice_lines')
        .select('id', { count: 'exact', head: true })
        .eq('delivery_id', delivery_id);

      if (count && count > 0) {
        return NextResponse.json({ 
          ok: false, 
          error: 'Impossible de supprimer une livraison deja facturee. Supprimez d\'abord les factures.' 
        }, { status: 400 });
      }
    }

    // 3. Restaurer le stock des produits de manière atomique
    const qtyByProduct = new Map<string, number>();
    
    for (const dp of (delivery as any).delivery_productions) {
      const production = dp.production;
      if (!production) continue;
      
      const productId = production.product_id as string;
      const qty = Number(production.quantity || 0);
      qtyByProduct.set(productId, (qtyByProduct.get(productId) || 0) + qty);
    }

    for (const [productId, totalQty] of qtyByProduct.entries()) {
      // Lire le stock actuel juste avant la mise à jour
      const { data: currentProduct } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();
      
      if (currentProduct) {
        const newStock = Number(currentProduct.stock || 0) + totalQty;
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productId);

        if (stockError) {
          return NextResponse.json({ ok: false, error: 'Erreur restauration stock' }, { status: 500 });
        }
      }
    }

    // 4. Supprimer la livraison (les liens delivery_productions seront supprimés via CASCADE)
    const { error: deleteError } = await supabase
      .from('deliveries')
      .delete()
      .eq('id', delivery_id);

    if (deleteError) {
      return NextResponse.json({ ok: false, error: 'Erreur suppression livraison' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
