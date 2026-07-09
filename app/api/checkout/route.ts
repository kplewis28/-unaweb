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

    const { data: application } = await supabase
      .from("applications")
      .select("*, retreat:retreats(*)")
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://una.eco";
    const retreat = application.retreat;

    const adapter = getPaymentAdapter();
    const result = await adapter.createCheckout({
      applicationId: application.id,
      retreatName: retreat?.name ?? "ÚNA Retreat",
      price: retreat?.price ?? 0,
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
