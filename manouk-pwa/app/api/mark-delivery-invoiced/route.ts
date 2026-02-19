import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { delivery_id, invoiced_at } = await req.json();

    if (!delivery_id) {
      return NextResponse.json({ ok: false, error: 'Delivery id manquant' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const dateValue = invoiced_at ? new Date(invoiced_at) : new Date();

    const { error } = await supabase
      .from('deliveries')
      .update({ invoiced_at: dateValue.toISOString() })
      .eq('id', delivery_id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
