import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { retreat_id, retreat_slug, name, email, country, profession, why_attend, how_heard, social_media } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }
    if (!retreat_id && !retreat_slug) {
      return NextResponse.json({ error: "Retreat is required." }, { status: 400 });
    }

    const supabase = await createClient();

    // Look up retreat by slug or id
    const query = supabase.from("retreats").select("id").eq("is_active", true);
    const { data: retreat } = retreat_slug
      ? await query.eq("slug", retreat_slug).single()
      : await query.eq("id", retreat_id).single();

    if (!retreat) {
      return NextResponse.json({ error: "Retreat not found or no longer active." }, { status: 404 });
    }

    const { error } = await supabase.from("applications").insert({
      retreat_id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      country: country?.trim() || null,
      profession: profession?.trim() || null,
      why_attend: why_attend?.trim() || null,
      how_heard: how_heard || null,
      social_media: social_media?.trim() || null,
      status: "pending",
    });

    if (error) {
      console.error("[POST /api/applications]", error);
      return NextResponse.json({ error: "Failed to save application." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
