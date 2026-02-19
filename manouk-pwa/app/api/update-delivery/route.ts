import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { delivery_id, customer_id, production_ids, delivery_date, notes } = await req.json();

    if (!delivery_id || !customer_id || !Array.isArray(production_ids) || production_ids.length === 0) {
      return NextResponse.json({ ok: false, error: 'Donnees invalides' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 1. Récupérer l'ancienne livraison pour restaurer le stock
    const { data: oldDelivery, error: fetchError } = await supabase
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

    if (fetchError || !oldDelivery) {
      return NextResponse.json({ ok: false, error: 'Livraison introuvable' }, { status: 404 });
    }

    // 2. Vérifier si la livraison est déjà facturée
    if (oldDelivery.invoiced_at) {
      const { count } = await supabase
        .from('invoice_lines')
        .select('id', { count: 'exact', head: true })
        .eq('delivery_id', delivery_id);

      if (count && count > 0) {
        return NextResponse.json({ 
          ok: false, 
          error: 'Impossible de modifier une livraison deja facturee. Supprimez d\'abord les factures.' 
        }, { status: 400 });
      }
    }

    // 3. Restaurer le stock des anciennes productions (opération atomique)
    const qtyByProductOld = new Map<string, number>();
    
    for (const dp of (oldDelivery as any).delivery_productions) {
      const production = dp.production;
      if (!production) continue;
      
      const productId = production.product_id as string;
      const qty = Number(production.quantity || 0);
      qtyByProductOld.set(productId, (qtyByProductOld.get(productId) || 0) + qty);
    }

    // Restaurer le stock de manière atomique pour éviter les conflits
    for (const [productId, totalQty] of qtyByProductOld.entries()) {
      // Lire le stock actuel juste avant la mise à jour
      const { data: currentProduct } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();
      
      if (currentProduct) {
        const newStock = Number(currentProduct.stock || 0) + totalQty;
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productId);
      }
    }

    // 4. Vérifier que les nouvelles productions existent et sont disponibles
    // IMPORTANT : Charger les productions APRÈS la restauration du stock pour avoir les bonnes valeurs
    const { data: productions, error: productionsError } = await supabase
      .from('productions')
      .select('id, product_id, quantity, product:products(id, name, stock)')
      .in('id', production_ids);

    if (productionsError || !productions) {
      return NextResponse.json({ ok: false, error: 'Erreur chargement productions' }, { status: 500 });
    }

    const foundIds = new Set(productions.map((p: any) => p.id));
    const missing = production_ids.filter((id: string) => !foundIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json({ ok: false, error: 'Productions manquantes: ' + missing.join(', ') }, { status: 400 });
    }

    // 5. Vérifier que les productions ne sont pas déjà livrées ailleurs
    const { data: alreadyDelivered } = await supabase
      .from('delivery_productions')
      .select('production_id, delivery_id')
      .in('production_id', production_ids)
      .neq('delivery_id', delivery_id);

    if (alreadyDelivered && alreadyDelivered.length > 0) {
      const ids = alreadyDelivered.map((row: any) => row.production_id).join(', ');
      return NextResponse.json({ ok: false, error: 'Productions deja livrees ailleurs: ' + ids }, { status: 400 });
    }

    // 6. Vérifier le stock disponible
    for (const prod of productions) {
      const product = (prod as any).product;
      if (!product) {
        return NextResponse.json({ ok: false, error: 'Produit manquant pour une production' }, { status: 400 });
      }
      
      const qty = Number(prod.quantity || 0);
      if (Number(product.stock || 0) < qty) {
        return NextResponse.json({
          ok: false,
          error: `Stock insuffisant pour ${product.name}: besoin de ${qty}, disponible ${product.stock}`
        }, { status: 400 });
      }
    }

    // 7. Supprimer les anciens liens
    const { error: deleteLinksError } = await supabase
      .from('delivery_productions')
      .delete()
      .eq('delivery_id', delivery_id);

    if (deleteLinksError) {
      return NextResponse.json({ ok: false, error: 'Erreur suppression anciens liens' }, { status: 500 });
    }

    // 8. Mettre à jour la livraison
    const { error: updateError } = await supabase
      .from('deliveries')
      .update({
        customer_id,
        delivery_date: delivery_date || new Date().toISOString().split('T')[0],
        notes
      })
      .eq('id', delivery_id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: 'Erreur mise a jour livraison' }, { status: 500 });
    }

    // 9. Créer les nouveaux liens
    const linkRows = production_ids.map((id: string) => ({
      delivery_id: delivery_id,
      production_id: id
    }));

    const { error: linkError } = await supabase
      .from('delivery_productions')
      .insert(linkRows);

    if (linkError) {
      return NextResponse.json({ ok: false, error: 'Erreur creation nouveaux liens' }, { status: 500 });
    }

    // 10. Déduire le stock des nouvelles productions (opération atomique)
    const qtyByProduct = new Map<string, number>();
    
    for (const prod of productions) {
      const productId = prod.product_id as string;
      const qty = Number(prod.quantity || 0);
      qtyByProduct.set(productId, (qtyByProduct.get(productId) || 0) + qty);
    }

    // Déduire le stock de manière atomique pour éviter les conflits
    for (const [productId, totalQty] of qtyByProduct.entries()) {
      // Lire le stock actuel juste avant la mise à jour
      const { data: currentProduct } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();
      
      if (currentProduct) {
        const newStock = Math.max(0, Number(currentProduct.stock || 0) - totalQty);
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
