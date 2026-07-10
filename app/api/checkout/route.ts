import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPaymentAdapter } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json();

    if (!accessCode?.trim()) {
      return NextResponse.json({ error: "Access code required." }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Fetch application, then its retreat separately: the applications ->
    // retreats foreign key isn't registered in PostgREST's schema cache, so
    // the embedded-relationship select ("*, retreat:retreats(*)") fails
    // with PGRST200.
    const { data: application } = await supabase
      .from("applications")
      .select("*")
      .eq("access_code", accessCode.trim().toUpperCase())
      .eq("status", "approved")
      .single();

    if (!application) {
      return NextResponse.json({ error: "Invalid or unrecognized code." }, { status: 404 });
    }

    if (application.access_code_expires_at) {
      const expires = new Date(application.access_code_expires_at);
      if (expires < new Date()) {
        return NextResponse.json(
          { error: "This code has expired. Contact us for a new one." },
          { status: 410 }
        );
      }
    }

    let retreat = null;
    if (application.retreat_id) {
      const { data: retreatRow } = await supabase
        .from("retreats")
        .select("*")
        .eq("id", application.retreat_id)
        .single();
      retreat = retreatRow ?? null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://una.eco";
    const numAttendees = Math.max(1, application.num_attendees ?? 1);
    // retreat.price_cents is in cents; the payment adapter expects a major
    // currency unit (it multiplies by 100 itself before sending to Stripe).
    const unitPrice = (retreat?.price_cents ?? 0) / 100;
    const totalPrice = unitPrice * numAttendees;

    const adapter = getPaymentAdapter();
    const result = await adapter.createCheckout({
      applicationId: application.id,
      retreatName: retreat?.name ?? "ÚNA Retreat",
      price: totalPrice,
      currency: retreat?.currency ?? "USD",
      customerEmail: application.email,
      customerName: application.name,
      accessCode: application.access_code!,
      successUrl: `${baseUrl}/pagar/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pagar?code=${application.access_code}`,
    });

    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("[POST /api/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout." }, { status: 500 });
  }
}
