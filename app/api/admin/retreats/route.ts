import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { MOCK_RETREAT } from "@/lib/mock-data";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { nameSchema, priceUsdSchema, totalSpotsSchema, firstZodError } from "@/lib/validation";

const createRetreatSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  start_date: z.string().trim().min(1, "Start date is required.").max(20),
  end_date: z.string().trim().min(1, "End date is required.").max(20),
  total_spots: totalSpotsSchema,
  price_usd: priceUsdSchema,
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

  const parsed = createRetreatSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }
  const { name, description, location, start_date, end_date, total_spots, price_usd, currency, is_open } = parsed.data;

  const slug = slugify(name);
  if (!slug) {
    return NextResponse.json({ error: "Could not generate a slug from the name." }, { status: 400 });
  }

  const newRetreat = {
    slug,
    name,
    description: description || null,
    location: location || null,
    start_date,
    end_date,
    total_spots,
    price_cents: Math.round(price_usd * 100),
    currency: (currency || "USD").toUpperCase(),
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
      return NextResponse.json({ error: "A retreat with a very similar name/slug already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create retreat." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, retreat }, { status: 201 });
}
