import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { production_id } = await req.json();

    if (!production_id) {
      return NextResponse.json({ ok: false, error: 'Production id manquant' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 1. Récupérer la production
    const { data: production, error: fetchError } = await supabase
      .from('productions')
      .select('product_id, quantity, product:products(id, name, stock)')
      .eq('id', production_id)
      .single();

    if (fetchError || !production) {
      return NextResponse.json({ ok: false, error: 'Production introuvable' }, { status: 404 });
    }

    // 2. Vérifier si la production est déjà livrée
    const { data: delivery } = await supabase
      .from('delivery_productions')
      .select('delivery_id')
      .eq('production_id', production_id)
      .single();

    if (delivery) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Impossible de supprimer une production deja livree. Supprimez d\'abord la livraison.' 
      }, { status: 400 });
    }

    const qty = Number(production.quantity || 0);

    // 3. Restaurer le stock du produit fini de manière atomique
    const { data: currentProduct } = await supabase
      .from('products')
      .select('stock')
      .eq('id', production.product_id)
      .single();
    
    if (currentProduct) {
      const newStock = Math.max(0, Number(currentProduct.stock || 0) - qty);
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', production.product_id);

      if (stockError) {
        return NextResponse.json({ ok: false, error: 'Erreur restauration stock produit' }, { status: 500 });
      }
    }

    // 4. Récupérer la recette pour restaurer les matières premières
    const { data: bom } = await supabase
      .from('product_materials')
      .select('raw_material_id, quantity_needed')
      .eq('product_id', production.product_id);

    // Restaurer les matières premières de manière atomique
    if (bom && bom.length > 0) {
      for (const mat of bom) {
        const { data: currentRawMat } = await supabase
          .from('raw_materials')
          .select('stock')
          .eq('id', mat.raw_material_id)
          .single();
        
        if (currentRawMat) {
          const needed = Number(mat.quantity_needed || 0) * qty;
          const restoredStock = Number(currentRawMat.stock || 0) + needed;

          await supabase
            .from('raw_materials')
            .update({ stock: restoredStock })
            .eq('id', mat.raw_material_id);
        }
      }
    }

    // 5. Supprimer la production
    const { error: deleteError } = await supabase
      .from('productions')
      .delete()
      .eq('id', production_id);

    if (deleteError) {
      return NextResponse.json({ ok: false, error: 'Erreur suppression production' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
