import { notFound } from "next/navigation";
import ApplicationForm from "./ApplicationForm";
import { MOCK_RETREAT } from "@/lib/mock-data";

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AplicarPage({ params }: Props) {
  const { slug } = await params;

  if (IS_MOCK) {
    if (slug !== MOCK_RETREAT.slug) notFound();
    return <ApplicationForm retreat={MOCK_RETREAT} />;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  // Explicit column list (never price_cents) — this runs as an anonymous
  // visitor, and the anon role's SELECT privilege on price_cents is
  // revoked at the database level, so `select("*")` would fail here.
  const { data: retreat } = await supabase
    .from("retreats")
    .select("id, slug, name, description, location, start_date, end_date, total_spots, currency, is_open, created_at")
    .eq("slug", slug)
    .eq("is_open", true)
    .single();

  if (!retreat) notFound();

  return <ApplicationForm retreat={retreat} />;
}
