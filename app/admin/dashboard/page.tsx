import type { Application } from "@/lib/supabase/types";
import DashboardClient from "./DashboardClient";
import { MOCK_APPLICATIONS } from "@/lib/mock-data";

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

export default async function DashboardPage() {
  let applications: Application[] = [];
  let userEmail = "admin@una.eco";

  if (!IS_MOCK) {
    const { createClient } = await import("@/lib/supabase/server");
    const { redirect } = await import("next/navigation");
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/admin/login");

    userEmail = user?.email ?? "";

    const { data, error } = await supabase
      .from("applications")
      .select("*, retreat:retreats(*)")
      .order("created_at", { ascending: false });

    if (error) console.error("Dashboard fetch error:", error);
    applications = (data as Application[]) ?? [];
  } else {
    applications = MOCK_APPLICATIONS;
  }

  return <DashboardClient applications={applications} userEmail={userEmail} />;
}
