import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(req: Request) {
  try {
    const { product_id, quantity, production_date, notes } = await req.json();
    
    if (!product_id || !quantity || quantity <= 0) {
      return NextResponse.json({ ok: false, error: 'Données invalides' }, { status: 400 });
    }

    console.log(`\n🏭 PRODUCTION: ${quantity} unités du produit ${product_id}`);

    // 1️⃣ Récupérer les infos du produit
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('name, stock')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ ok: false, error: 'Produit non trouvé' }, { status: 404 });
    }

    // 2️⃣ Récupérer la BOM (nomenclature)
    const { data: bom, error: bomError } = await supabase
      .from('product_materials')
      .select('raw_material_id, quantity')
      .eq('product_id', product_id);

    if (bomError) {
      return NextResponse.json({ ok: false, error: 'Erreur BOM: ' + bomError.message }, { status: 500 });
    }

    // 3️⃣ Vérifier qu'il y a assez de stock de matières premières
    if (bom && bom.length > 0) {
      for (const material of bom) {
        const needed = material.quantity * quantity;
        
        const { data: rawMaterial } = await supabase
          .from('raw_materials')
          .select('name, stock')
          .eq('id', material.raw_material_id)
          .single();

        if (rawMaterial && rawMaterial.stock < needed) {
          return NextResponse.json({ 
            ok: false, 
            error: `Stock insuffisant pour ${rawMaterial.name}: besoin de ${needed}, disponible ${rawMaterial.stock}` 
          }, { status: 400 });
        }
      }
    }

    // 4️⃣ Décompter les matières premières
    if (bom && bom.length > 0) {
      for (const material of bom) {
        const stockToRemove = material.quantity * quantity;
        
        const { data: rawMaterial } = await supabase
          .from('raw_materials')
          .select('stock, name')
          .eq('id', material.raw_material_id)
          .single();

        if (rawMaterial) {
          const newStock = rawMaterial.stock - stockToRemove;
          
          await supabase
            .from('raw_materials')
            .update({ stock: newStock })
            .eq('id', material.raw_material_id);
          
          console.log(`  ➖ ${rawMaterial.name}: ${rawMaterial.stock} → ${newStock} (-${stockToRemove})`);
        }
      }
    }

    // 5️⃣ Augmenter le stock du produit fini
    const newProductStock = product.stock + quantity;
    await supabase
      .from('products')
      .update({ stock: newProductStock })
      .eq('id', product_id);
    
    console.log(`  ➕ ${product.name}: ${product.stock} → ${newProductStock} (+${quantity})`);

    // 6️⃣ Enregistrer la production
    const { data: production, error: insertError } = await supabase
      .from('productions')
      .insert({
        product_id,
        quantity,
        production_date: production_date || new Date().toISOString().split('T')[0],
        notes
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    console.log(`✅ Production enregistrée:`, production);

    return NextResponse.json({ ok: true, production });
  } catch (err: any) {
    console.error('❌ Erreur création production:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
