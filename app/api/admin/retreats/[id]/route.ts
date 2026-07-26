import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOCK_RETREAT } from "@/lib/mock-data";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json();
  const { price_usd } = body;

  if (typeof price_usd !== "number" || !Number.isFinite(price_usd) || price_usd <= 0) {
    return NextResponse.json({ error: "price_usd must be a positive number." }, { status: 400 });
  }

  const price_cents = Math.round(price_usd * 100);

  if (IS_MOCK) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie || !verifySessionToken(sessionCookie.value)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (MOCK_RETREAT.id !== id) {
      return NextResponse.json({ error: "Retreat not found." }, { status: 404 });
    }

    MOCK_RETREAT.price_cents = price_cents;

    return NextResponse.json({ ok: true, retreat: MOCK_RETREAT });
  }

  const { createClient, createServiceClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const serviceClient = await createServiceClient();
  const { data: retreat, error } = await serviceClient
    .from("retreats")
    .update({ price_cents })
    .eq("id", id)
    .select()
    .single();

  if (error || !retreat) {
    console.error("[PATCH /api/admin/retreats] update error:", error);
    return NextResponse.json({ error: "Failed to update retreat." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, retreat });
}
