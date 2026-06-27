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

  const { data: retreat } = await supabase
    .from("retreats")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!retreat) notFound();

  return <ApplicationForm retreat={retreat} />;
}
