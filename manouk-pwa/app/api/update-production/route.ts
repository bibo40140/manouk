import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { production_id, product_id, quantity, production_date, notes } = await req.json();

    if (!production_id || !product_id || !quantity) {
      return NextResponse.json({ ok: false, error: 'Donnees invalides' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 1. Récupérer l'ancienne production pour restaurer le stock
    const { data: oldProduction, error: fetchError } = await supabase
      .from('productions')
      .select('product_id, quantity, product:products(id, name, stock)')
      .eq('id', production_id)
      .single();

    if (fetchError || !oldProduction) {
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
        error: 'Impossible de modifier une production deja livree. Supprimez d\'abord la livraison.' 
      }, { status: 400 });
    }

    const oldQuantity = Number(oldProduction.quantity || 0);

    // 3. Restaurer le stock du produit fini (ancien) - opération atomique
    const { data: currentOldProduct } = await supabase
      .from('products')
      .select('stock')
      .eq('id', oldProduction.product_id)
      .single();
    
    if (currentOldProduct) {
      const newStock = Math.max(0, Number(currentOldProduct.stock || 0) - oldQuantity);
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', oldProduction.product_id);
    }

    // 4. Récupérer la recette (BOM) de l'ancien produit pour restaurer les matières premières
    const { data: oldBom } = await supabase
      .from('product_materials')
      .select('raw_material_id, quantity_needed')
      .eq('product_id', oldProduction.product_id);

    // Restaurer les matières premières de manière atomique
    if (oldBom && oldBom.length > 0) {
      for (const mat of oldBom) {
        const { data: rawMat } = await supabase
          .from('raw_materials')
          .select('stock')
          .eq('id', mat.raw_material_id)
          .single();

        if (rawMat) {
          const restoredStock = Number(rawMat.stock || 0) + (Number(mat.quantity_needed || 0) * oldQuantity);
          await supabase
            .from('raw_materials')
            .update({ stock: restoredStock })
            .eq('id', mat.raw_material_id);
        }
      }
    }

    // 5. Récupérer le nouveau produit et sa recette
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('id', product_id)
      .single();

    if (productError || !newProduct) {
      return NextResponse.json({ ok: false, error: 'Produit introuvable' }, { status: 404 });
    }

    const { data: newBom } = await supabase
      .from('product_materials')
      .select('raw_material_id, quantity_needed, raw_material:raw_materials(id, name, stock, alert_threshold)')
      .eq('product_id', product_id);

    // 6. Vérifier le stock des matières premières
    if (newBom && newBom.length > 0) {
      for (const mat of newBom) {
        const rawMaterial = (mat as any).raw_material;
        const needed = Number(mat.quantity_needed || 0) * Number(quantity);
        const available = Number(rawMaterial?.stock || 0);
        
        if (available < needed) {
          return NextResponse.json({
            ok: false,
            error: `Stock insuffisant pour ${rawMaterial?.name || 'matiere premiere'}: besoin de ${needed}, disponible ${available}`
          }, { status: 400 });
        }
      }
    }

    // 7. Mettre à jour la production
    const { error: updateError } = await supabase
      .from('productions')
      .update({
        product_id,
        quantity,
        production_date: production_date || new Date().toISOString().split('T')[0],
        notes
      })
      .eq('id', production_id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: 'Erreur mise a jour production' }, { status: 500 });
    }

    // 8. Déduire les matières premières de manière atomique
    if (newBom && newBom.length > 0) {
      for (const mat of newBom) {
        const needed = Number(mat.quantity_needed || 0) * Number(quantity);
        
        // Lire le stock actuel
        const { data: currentRawMat } = await supabase
          .from('raw_materials')
          .select('stock')
          .eq('id', mat.raw_material_id)
          .single();
        
        if (currentRawMat) {
          const newStock = Math.max(0, Number(currentRawMat.stock || 0) - needed);
          await supabase
            .from('raw_materials')
            .update({ stock: newStock })
            .eq('id', mat.raw_material_id);
        }
      }
    }

    // 9. Ajouter au stock du produit fini de manière atomique
    const { data: currentNewProduct } = await supabase
      .from('products')
      .select('stock')
      .eq('id', product_id)
      .single();
    
    if (currentNewProduct) {
      const updatedStock = Number(currentNewProduct.stock || 0) + Number(quantity);
      await supabase
        .from('products')
        .update({ stock: updatedStock })
        .eq('id', product_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
