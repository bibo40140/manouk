import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(req: Request) {
  try {
    const timestamp = new Date().toISOString();
    const { lines } = await req.json();
    
    console.log(`\n\n========== [${timestamp}] DÉCOMPTE STOCK APPELÉ ==========`);
    console.log('🔄 Nombre de lignes:', lines.length);
    console.log('🔄 Détail des lignes:', JSON.stringify(lines, null, 2));
    
    for (const line of lines) {
      // Décompter uniquement le stock du produit fini
      // (les matières premières sont décomptées lors de la production)
      const { data: product } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', line.product_id)
        .single();

      if (product) {
        const newProductStock = Math.max(0, product.stock - line.quantity);
        await supabase
          .from('products')
          .update({ stock: newProductStock })
          .eq('id', line.product_id);
        console.log(`✅ Produit ${product.name}: stock ${product.stock} → ${newProductStock} (vendu: ${line.quantity})`);
      }
    }
    
    console.log(`========== [${timestamp}] DÉCOMPTE STOCK TERMINÉ ==========\n\n`);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('❌ Erreur décompte stock:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
