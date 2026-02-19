import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { customer_id, production_ids, delivery_date, notes } = await req.json();

    if (!customer_id || !Array.isArray(production_ids) || production_ids.length === 0) {
      return NextResponse.json({ ok: false, error: 'Donnees invalides' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

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

    const { data: alreadyDelivered } = await supabase
      .from('delivery_productions')
      .select('production_id')
      .in('production_id', production_ids);

    if (alreadyDelivered && alreadyDelivered.length > 0) {
      const ids = alreadyDelivered.map((row: any) => row.production_id).join(', ');
      return NextResponse.json({ ok: false, error: 'Productions deja livrees: ' + ids }, { status: 400 });
    }

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

    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        customer_id,
        delivery_date: delivery_date || new Date().toISOString().split('T')[0],
        notes
      })
      .select()
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json({ ok: false, error: 'Erreur creation livraison' }, { status: 500 });
    }

    const linkRows = production_ids.map((id: string) => ({
      delivery_id: delivery.id,
      production_id: id
    }));

    const { error: linkError } = await supabase
      .from('delivery_productions')
      .insert(linkRows);

    if (linkError) {
      return NextResponse.json({ ok: false, error: 'Erreur lien livraisons' }, { status: 500 });
    }

    const qtyByProduct = new Map<string, number>();
    const productInfo = new Map<string, any>();
    for (const prod of productions) {
      const productId = prod.product_id as string;
      const qty = Number(prod.quantity || 0);
      qtyByProduct.set(productId, (qtyByProduct.get(productId) || 0) + qty);
      if (!productInfo.has(productId)) {
        productInfo.set(productId, (prod as any).product);
      }
    }

    for (const [productId, totalQty] of qtyByProduct.entries()) {
      const product = productInfo.get(productId);
      if (!product) continue;
      const newStock = Math.max(0, Number(product.stock || 0) - totalQty);
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);
    }

    return NextResponse.json({ ok: true, delivery });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
