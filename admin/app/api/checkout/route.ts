import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPaymentAdapter } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json();

    if (!accessCode?.trim()) {
      return NextResponse.json({ error: "Código de acceso requerido." }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: application } = await supabase
      .from("applications")
      .select("*, retreat:retreats(*)")
      .eq("access_code", accessCode.trim().toUpperCase())
      .eq("status", "approved")
      .single();

    if (!application) {
      return NextResponse.json({ error: "Código no válido o no encontrado." }, { status: 404 });
    }

    if (application.access_code_expires_at) {
      const expires = new Date(application.access_code_expires_at);
      if (expires < new Date()) {
        return NextResponse.json(
          { error: "Este código ha expirado. Contacta a ÚNA para obtener uno nuevo." },
          { status: 410 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://una.eco";
    const retreat = application.retreat;

    const adapter = getPaymentAdapter();
    const result = await adapter.createCheckout({
      applicationId: application.id,
      retreatName: retreat?.name ?? "Retiro ÚNA",
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
    return NextResponse.json({ error: "Error al crear el pago." }, { status: 500 });
  }
}
