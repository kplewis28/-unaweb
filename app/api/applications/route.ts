import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { retreat_id, name, email, country, profession, why_attend, how_heard, social_media } = body;

    if (!retreat_id || !name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Nombre, correo y retiro son requeridos." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify retreat exists and is active
    const { data: retreat } = await supabase
      .from("retreats")
      .select("id")
      .eq("id", retreat_id)
      .eq("is_active", true)
      .single();

    if (!retreat) {
      return NextResponse.json({ error: "Retiro no encontrado." }, { status: 404 });
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
      return NextResponse.json({ error: "Error al guardar tu aplicación." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
