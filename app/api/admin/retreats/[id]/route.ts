import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { MOCK_RETREAT } from "@/lib/mock-data";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { nameSchema, priceUsdSchema, totalSpotsSchema, firstZodError } from "@/lib/validation";

const patchRetreatSchema = z.object({
  name: nameSchema.optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  start_date: z.string().trim().min(1).max(20).optional(),
  end_date: z.string().trim().min(1).max(20).optional(),
  total_spots: totalSpotsSchema.optional(),
  price_usd: priceUsdSchema.optional(),
  currency: z.string().trim().max(10).optional().nullable(),
  is_open: z.boolean().optional(),
});

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

async function isAuthorizedAdmin(): Promise<boolean> {
  if (IS_MOCK) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    return !!sessionCookie && verifySessionToken(sessionCookie.value);
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = patchRetreatSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }
  const { name, description, location, start_date, end_date, total_spots, price_usd, currency, is_open } = parsed.data;

  const updates: Record<string, unknown> = {};

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description || null;
  if (location !== undefined) updates.location = location || null;
  if (start_date !== undefined) updates.start_date = start_date;
  if (end_date !== undefined) updates.end_date = end_date;
  if (total_spots !== undefined) updates.total_spots = total_spots;
  if (price_usd !== undefined) updates.price_cents = Math.round(price_usd * 100);
  if (currency !== undefined) updates.currency = (currency || "USD").toUpperCase();
  if (is_open !== undefined) updates.is_open = is_open;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  if (IS_MOCK) {
    if (MOCK_RETREAT.id !== id) {
      return NextResponse.json({ error: "Retreat not found." }, { status: 404 });
    }
    Object.assign(MOCK_RETREAT, updates);
    return NextResponse.json({ ok: true, retreat: MOCK_RETREAT });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const serviceClient = await createServiceClient();
  const { data: retreat, error } = await serviceClient
    .from("retreats")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !retreat) {
    console.error("[PATCH /api/admin/retreats] update error:", error);
    return NextResponse.json({ error: "Failed to update retreat." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, retreat });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (IS_MOCK) {
    return NextResponse.json({ error: "Cannot delete the sample retreat in mock mode." }, { status: 400 });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const serviceClient = await createServiceClient();

  const { count, error: countError } = await serviceClient
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("retreat_id", id);

  if (countError) {
    console.error("[DELETE /api/admin/retreats] count error:", countError);
    return NextResponse.json({ error: "Failed to check existing applications." }, { status: 500 });
  }

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this retreat has ${count} associated application(s).` },
      { status: 409 }
    );
  }

  const { error: deleteError } = await serviceClient.from("retreats").delete().eq("id", id);

  if (deleteError) {
    console.error("[DELETE /api/admin/retreats] delete error:", deleteError);
    return NextResponse.json({ error: "Failed to delete retreat." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
