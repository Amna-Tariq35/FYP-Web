import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

// Supabase Admin Client (Taake backend se order update ho sake bina RLS issue ke)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Yaad rakhein: Yeh Service Role Key honi chahiye, anon key nahi
);

export async function POST(request: Request) {
  try {
    const { session_id, order_id } = await request.json();

    if (!session_id || !order_id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Stripe se check karein ke payment waqai successful hui hai ya nahi
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // 2. Supabase mein order ka status 'paid' kar dein
      const { error } = await supabaseAdmin
        .from('orders') // Agar aapke table ka naam kuch aur hai toh yahan change karein
        .update({ status: 'paid' })
        .eq('id', order_id);

      if (error) throw error;

      return NextResponse.json({ success: true, status: 'paid' });
    } else {
      return NextResponse.json({ success: false, status: session.payment_status });
    }
  } catch (error: any) {
    console.error("Verify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}