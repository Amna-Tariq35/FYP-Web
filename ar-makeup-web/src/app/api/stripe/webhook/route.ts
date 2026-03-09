import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

// ensure Node runtime (Stripe SDK and raw body needed)
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  // handle relevant event types
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId as string | undefined;

      if (orderId) {
        try {
          const supabase = await createSupabaseServerClient();
          await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId);
          console.log(`Order ${orderId} marked paid via webhook`);
        } catch (e) {
          console.error("Failed to update order status in webhook:", e);
        }
      } else {
        console.warn("checkout.session.completed event missing orderId metadata");
      }
      break;
    }
    // you can add more events (payment_intent.succeeded, etc.) as required
    default:
      // ignore other events
      break;
  }

  return new Response("ok");
}
