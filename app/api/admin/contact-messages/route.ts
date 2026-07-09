import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/admin/contact-messages]", error);
    return NextResponse.json({ error: "Failed to fetch messages." }, { status: 500 });
  }

  return NextResponse.json({ messages: data });
}
