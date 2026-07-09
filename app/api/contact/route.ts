import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, interest, message } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      interest: interest?.trim() || null,
      message: message?.trim() || null,
    });

    if (error) {
      console.error("[POST /api/contact]", error);
      return NextResponse.json({ error: "Failed to save message." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
