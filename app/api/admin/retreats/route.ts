import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOCK_RETREAT } from "@/lib/mock-data";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

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

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (IS_MOCK) {
    return NextResponse.json({ retreats: [MOCK_RETREAT], applicationCounts: {} });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const serviceClient = await createServiceClient();

  const [{ data: retreats, error: retreatsError }, { data: applications, error: applicationsError }] =
    await Promise.all([
      serviceClient.from("retreats").select("*").order("start_date", { ascending: true }),
      serviceClient.from("applications").select("retreat_id"),
    ]);

  if (retreatsError || applicationsError) {
    console.error("[GET /api/admin/retreats]", retreatsError ?? applicationsError);
    return NextResponse.json({ error: "Failed to fetch retreats." }, { status: 500 });
  }

  const applicationCounts: Record<string, number> = {};
  for (const application of applications ?? []) {
    applicationCounts[application.retreat_id] = (applicationCounts[application.retreat_id] ?? 0) + 1;
  }

  return NextResponse.json({ retreats: retreats ?? [], applicationCounts });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, location, start_date, end_date, total_spots, price_usd, currency, is_open } = body;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "El nombre del retiro es obligatorio." }, { status: 400 });
  }
  if (!start_date || !end_date) {
    return NextResponse.json({ error: "Las fechas de inicio y fin son obligatorias." }, { status: 400 });
  }

  const priceUsdNum = Number(price_usd);
  if (!Number.isFinite(priceUsdNum) || priceUsdNum <= 0) {
    return NextResponse.json({ error: "El precio debe ser un número positivo." }, { status: 400 });
  }

  const spotsNum = Number(total_spots);
  if (!Number.isFinite(spotsNum) || spotsNum <= 0) {
    return NextResponse.json({ error: "Los cupos deben ser un número positivo." }, { status: 400 });
  }

  const slug = slugify(name);
  if (!slug) {
    return NextResponse.json({ error: "No se pudo generar un slug a partir del nombre." }, { status: 400 });
  }

  const newRetreat = {
    slug,
    name: name.trim(),
    description: description?.trim() || null,
    location: location?.trim() || null,
    start_date,
    end_date,
    total_spots: Math.round(spotsNum),
    price_cents: Math.round(priceUsdNum * 100),
    currency: (currency?.trim() || "USD").toUpperCase(),
    is_open: is_open ?? true,
  };

  if (IS_MOCK) {
    return NextResponse.json(
      { ok: true, retreat: { id: `mock-${slug}`, ...newRetreat, created_at: new Date().toISOString() } },
      { status: 201 }
    );
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const serviceClient = await createServiceClient();

  const { data: retreat, error } = await serviceClient.from("retreats").insert(newRetreat).select().single();

  if (error) {
    console.error("[POST /api/admin/retreats]", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe un retiro con un nombre/slug muy similar." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create retreat." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, retreat }, { status: 201 });
}
