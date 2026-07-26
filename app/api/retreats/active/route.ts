import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Public route — never select price_cents here, this response is served
// straight to the marketing site with no auth.
export async function GET() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: retreat, error } = await supabase
    .from("retreats")
    .select("name, description, location, start_date, end_date, total_spots")
    .eq("is_open", true)
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[GET /api/retreats/active]", error);
    return NextResponse.json({ retreat: null }, { status: 500 });
  }

  return NextResponse.json({ retreat: retreat ?? null });
}
