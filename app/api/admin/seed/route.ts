import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if retreat already exists
    const { data: existing } = await supabase
      .from("retreats")
      .select("id, slug")
      .eq("slug", "sierra-nevada-2026")
      .single();

    if (existing) {
      return NextResponse.json({ ok: true, message: "Retreat already exists.", retreat: existing });
    }

    // Insert the retreat
    const { data, error } = await supabase.from("retreats").insert({
      slug: "sierra-nevada-2026",
      name: "Sierra Nevada · September 2026",
      description: "A small group of selected participants are invited into the Heart of the World, held by the Elder Sisters of the Wiwa, Arhuaco, and Kogi.",
      location: "Sierra Nevada de Santa Marta, Colombia",
      start_date: "2026-09-01",
      end_date: "2026-09-07",
      capacity: 12,
      price: 0,
      currency: "USD",
      is_active: true,
    }).select().single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Retreat created successfully.", retreat: data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
