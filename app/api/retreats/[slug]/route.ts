import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: retreat, error } = await supabase
    .from("retreats")
    .select("id, name, description, location, start_date, end_date, total_spots")
    .eq("slug", slug)
    .eq("is_open", true)
    .single();

  if (error || !retreat) {
    return NextResponse.json({ error: "Retreat not found or no longer active." }, { status: 404 });
  }

  return NextResponse.json({ retreat });
}
