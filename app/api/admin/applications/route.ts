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

  // Fetched separately and merged in JS: the applications -> retreats
  // foreign key isn't registered in PostgREST's schema cache, so the
  // embedded-relationship select ("*, retreat:retreats(*)") fails with
  // PGRST200.
  const [{ data: applications, error: applicationsError }, { data: retreats, error: retreatsError }] =
    await Promise.all([
      serviceClient.from("applications").select("*").order("created_at", { ascending: false }),
      serviceClient.from("retreats").select("*"),
    ]);

  if (applicationsError || retreatsError) {
    console.error("[GET /api/admin/applications]", applicationsError ?? retreatsError);
    return NextResponse.json({ error: "Failed to fetch applications." }, { status: 500 });
  }

  const retreatsById = new Map((retreats ?? []).map((retreat) => [retreat.id, retreat]));
  const merged = (applications ?? []).map((application) => ({
    ...application,
    retreat: retreatsById.get(application.retreat_id) ?? null,
  }));

  return NextResponse.json({ applications: merged });
}
