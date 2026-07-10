import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPaymentAdapter } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature =
    request.headers.get("stripe-signature") ??
    request.headers.get("x-wompi-signature") ??
    "";

  const adapter = getPaymentAdapter();
  const event = await adapter.verifyWebhook(payload, signature);

  if (!event) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "payment.succeeded" && event.applicationId) {
    const supabase = await createServiceClient();
    await supabase
      .from("applications")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", event.applicationId);

    await supabase
      .from("access_codes")
      .update({ status: "used", used_at: new Date().toISOString() })
      .eq("application_id", event.applicationId)
      .eq("status", "active");
  }

  return NextResponse.json({ received: true });
}
